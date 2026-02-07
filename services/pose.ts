
export const SERVICE_UUID = '0000ffe5-0000-1000-8000-00805f9a34fb';
export const NOTIFY_CHARACTERISTIC_UUID = '0000FFE4-0000-1000-8000-00805F9A34FB';
export const DEVICE_NAME = 'WT901BLE68';

// Interface for parsed pose data
export interface PoseData {
  fullHex: string;
  pitch: number; // 俯仰角 (degrees)
  roll: number;  // 横滚角 (degrees)
  yaw: number;   // 偏航角 (degrees)
}

/**
 * Parse BLE notification data for pose information
 * @param characteristicValue - Base64 encoded characteristic value
 * @returns Parsed pose data object with pitch, roll, yaw angles
 */
export const parsePoseData = (characteristicValue: string): PoseData | null => {
  try {
    // Decode base64 value
    const rawData = atob(characteristicValue);

    // Convert to hex string
    let hexString = '';
    for (let i = 0; i < rawData.length; i++) {
      const hex = rawData.charCodeAt(i).toString(16).toUpperCase();
      hexString += hex.padStart(2, '0');
    }

    // Ensure we have enough data (at least 12 hex characters for 3 angles)
    if (hexString.length < 12) {
      console.error('Insufficient pose data:', hexString);
      return null;
    }

    // Extract the last 12 characters (6 bytes)
    const last12Chars = hexString.slice(-12);

    // Parse each angle (2 bytes per angle, little-endian)
    // Each angle is a signed 16-bit integer with resolution 0.1 degrees
    const pitchHex = last12Chars.substring(0, 4);
    const rollHex = last12Chars.substring(4, 8);
    const yawHex = last12Chars.substring(8, 12);

    // Convert hex to signed integer (little-endian)
    const pitchRaw = parseInt(pitchHex.substring(2, 4) + pitchHex.substring(0, 2), 16);
    const rollRaw = parseInt(rollHex.substring(2, 4) + rollHex.substring(0, 2), 16);
    const yawRaw = parseInt(yawHex.substring(2, 4) + yawHex.substring(0, 2), 16);

    // Convert to signed 16-bit integer
    const signedPitch = pitchRaw > 32767 ? pitchRaw - 65536 : pitchRaw;
    const signedRoll = rollRaw > 32767 ? rollRaw - 65536 : rollRaw;
    const signedYaw = yawRaw > 32767 ? yawRaw - 65536 : yawRaw;

    // Convert to degrees (divide by 10 for 0.1 degree resolution)
    const pitch = signedPitch / 10;
    const roll = signedRoll / 10;
    const yaw = signedYaw / 10;

    // Create data object
    return {
      fullHex: hexString,
      pitch,
      roll,
      yaw
    };
  } catch (error) {
    console.error('Error parsing pose data:', error);
    return null;
  }
};