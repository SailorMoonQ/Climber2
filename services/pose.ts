
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
    const rollHex = last12Chars.substring(0, 4);
    const pitchHex = last12Chars.substring(4, 8);
    const yawHex = last12Chars.substring(8, 12);

    // Calculate roll using user-specified formula: ((RollH<<8)|RollL)/32768*180
    // RollH is high byte, RollL is low byte (little-endian format)
    const rollL = parseInt(rollHex.substring(0, 2), 16);
    const rollH = parseInt(rollHex.substring(2, 4), 16);
    const pitchL = parseInt(pitchHex.substring(0, 2), 16);
    const pitchH = parseInt(pitchHex.substring(2, 4), 16);
    const yawL = parseInt(yawHex.substring(0, 2), 16);
    const yawH = parseInt(yawHex.substring(2, 4), 16);

    // Combine high and low bytes to get 16-bit value
    let rollCombined = (rollH << 8) | rollL;
    const pitchCombined = (pitchH << 8) | pitchL;
    const yawCombined = (yawH << 8) | yawL;


    const roll = rollCombined / 32768 * 180;
    const pitch = pitchCombined / 32768 * 180;
    const yaw = yawCombined / 32768 * 180;

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