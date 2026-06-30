import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { Device, State, Subscription } from 'react-native-ble-plx';
import { bleManager, requestPermissions } from '@/services/bluetooth';
import { ForceService } from '@/services/force-service';
import { KYTOHeartRateService } from '@/services/kyto-heartrate-service';
import { WitMotionService } from '@/services/wit-motion-service';
import { DEVICE_NAME as POSE_DEVICE_NAME } from '@/services/pose';

export type BleStatus = 'connecting' | 'connected' | 'disconnected' | 'disabled';
export type BleDeviceKey = 'force' | 'heartRate' | 'pose';

export interface BleDeviceInfo {
  key: BleDeviceKey;
  status: BleStatus;
}

interface BluetoothContextValue {
  devices: BleDeviceInfo[];
  connectedCount: number;
  total: number;
  retry: () => void;
  setDeviceEnabled: (key: BleDeviceKey, enabled: boolean) => void;
}

// Connect order is also the (sequential) scan order — one scan finishes before the
// next starts, so the two services never scan at the same time (avoids BleError).
const ORDER: BleDeviceKey[] = ['force', 'heartRate', 'pose'];

const matchers: Record<BleDeviceKey, (d: Device) => boolean> = {
  force: (d) => !!(d.name?.startsWith('QD_CLIMETE') || d.localName?.startsWith('QD_CLIMETE')),
  heartRate: (d) => !!(d.name?.includes('KYTO') || d.localName?.includes('KYTO')),
  pose: (d) => d.name === POSE_DEVICE_NAME || d.localName === POSE_DEVICE_NAME,
};

const connectors: Record<BleDeviceKey, (d: Device) => Promise<boolean>> = {
  force: (d) => ForceService.connectToDevice(d),
  heartRate: (d) => KYTOHeartRateService.connectToDevice(d),
  pose: (d) => WitMotionService.connectToDevice(d),
};

const disconnectors: Record<BleDeviceKey, () => Promise<void>> = {
  force: () => ForceService.disconnect(),
  heartRate: () => KYTOHeartRateService.disconnect(),
  pose: () => WitMotionService.disconnect(),
};

const SCAN_TIMEOUT = 12000; // give up scanning for one device after 12s
const RETRY_DELAY = 8000; // re-attempt missing devices after 8s

const BluetoothContext = createContext<BluetoothContextValue | undefined>(undefined);

export const BluetoothProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [statuses, setStatuses] = useState<Record<BleDeviceKey, BleStatus>>({
    force: 'disconnected',
    heartRate: 'disconnected',
    pose: 'disconnected',
  });
  const statusRef = useRef(statuses);
  statusRef.current = statuses;

  const runningRef = useRef(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const disconnectSubsRef = useRef<Partial<Record<BleDeviceKey, Subscription>>>({});
  const connectRef = useRef<() => void>(() => {});
  const mountedRef = useRef(true);

  const setStatus = useCallback((key: BleDeviceKey, s: BleStatus) => {
    if (!mountedRef.current) return;
    setStatuses((prev) => (prev[key] === s ? prev : { ...prev, [key]: s }));
  }, []);

  const scheduleRetry = useCallback(() => {
    if (retryTimerRef.current) return;
    retryTimerRef.current = setTimeout(() => {
      retryTimerRef.current = null;
      connectRef.current();
    }, RETRY_DELAY);
  }, []);

  // Scan with no service filter and resolve on the first name-matched device, then
  // stop scanning. Resolves null on timeout/error so the caller can move on.
  const scanForOne = useCallback((key: BleDeviceKey): Promise<Device | null> => {
    return new Promise((resolve) => {
      let done = false;
      const finish = (dev: Device | null) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        try {
          bleManager.stopDeviceScan();
        } catch {
          // ignore — scan may already be stopped
        }
        resolve(dev);
      };
      const timer = setTimeout(() => finish(null), SCAN_TIMEOUT);
      try {
        bleManager.startDeviceScan(null, null, (err, dev) => {
          if (err) {
            finish(null);
            return;
          }
          if (dev && matchers[key](dev)) finish(dev);
        });
      } catch {
        finish(null);
      }
    });
  }, []);

  const connectMissing = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    try {
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) return;

      for (const key of ORDER) {
        if (statusRef.current[key] === 'connected' || statusRef.current[key] === 'disabled') continue;
        setStatus(key, 'connecting');

        const device = await scanForOne(key);
        if (!device) {
          setStatus(key, 'disconnected');
          continue;
        }

        let ok = false;
        try {
          ok = await connectors[key](device);
        } catch {
          ok = false;
        }

        // If the user disabled this device mid-connect, undo it (don't let the
        // in-flight connect override the user's Disconnect). Cast defeats the
        // control-flow narrowing from the loop-top `disabled` continue.
        if ((statusRef.current[key] as BleStatus) === 'disabled') {
          if (ok) void disconnectors[key]().catch(() => {});
          continue;
        }

        if (ok) {
          setStatus(key, 'connected');
          disconnectSubsRef.current[key]?.remove();
          disconnectSubsRef.current[key] = bleManager.onDeviceDisconnected(device.id, () => {
            if ((statusRef.current[key] as BleStatus) === 'disabled') return; // intentionally turned off (read at fire time)
            setStatus(key, 'disconnected');
            scheduleRetry();
          });
        } else {
          setStatus(key, 'disconnected');
        }
      }
    } finally {
      runningRef.current = false;
      const missing = ORDER.some(
        (k) => statusRef.current[k] !== 'connected' && statusRef.current[k] !== 'disabled',
      );
      if (missing) scheduleRetry();
    }
  }, [scanForOne, setStatus, scheduleRetry]);

  // keep the ref pointing at the latest connectMissing so scheduleRetry stays stable
  useEffect(() => {
    connectRef.current = () => {
      void connectMissing();
    };
  }, [connectMissing]);

  useEffect(() => {
    mountedRef.current = true;
    // Start connecting once Bluetooth is powered on (emits current state immediately).
    const stateSub = bleManager.onStateChange((state) => {
      if (state === State.PoweredOn) {
        void connectMissing();
      } else {
        // adapter off / resetting — everything is effectively disconnected
        setStatuses({ force: 'disconnected', heartRate: 'disconnected', pose: 'disconnected' });
      }
    }, true);

    return () => {
      mountedRef.current = false;
      stateSub.remove();
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      Object.values(disconnectSubsRef.current).forEach((s) => s?.remove());
      disconnectSubsRef.current = {};
      try {
        bleManager.stopDeviceScan(); // release any in-flight scan on teardown
      } catch {
        // ignore — scan may already be stopped
      }
    };
  }, [connectMissing]);

  const retry = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    void connectMissing();
  }, [connectMissing]);

  // Per-device on/off. Disabling drops the device and stops auto-reconnect; enabling
  // reconnects it — lets the accessory modal's "Disconnect" actually stick.
  const setDeviceEnabled = useCallback((key: BleDeviceKey, enabled: boolean) => {
    if (enabled) {
      setStatus(key, 'disconnected');
      connectRef.current();
    } else {
      setStatus(key, 'disabled');
      disconnectSubsRef.current[key]?.remove();
      delete disconnectSubsRef.current[key];
      void disconnectors[key]().catch(() => {});
    }
  }, [setStatus]);

  const devices: BleDeviceInfo[] = ORDER.map((key) => ({ key, status: statuses[key] }));
  const connectedCount = devices.filter((d) => d.status === 'connected').length;

  return (
    <BluetoothContext.Provider value={{ devices, connectedCount, total: ORDER.length, retry, setDeviceEnabled }}>
      {children}
    </BluetoothContext.Provider>
  );
};

export const useBluetooth = (): BluetoothContextValue => {
  const ctx = useContext(BluetoothContext);
  if (!ctx) {
    throw new Error('useBluetooth must be used within a BluetoothProvider');
  }
  return ctx;
};
