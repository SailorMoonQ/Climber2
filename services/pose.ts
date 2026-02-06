
export const SERVICE_UUID = '0000ffe5-0000-1000-8000-00805f9a34fb';
export const NOTIFY_CHARACTERISTIC_UUID = '0000FFE4-0000-1000-8000-00805F9A34FB';
export const DEVICE_NAME = 'WT901BLE68';

// Interface for parsed pose data
export interface PoseData {
  fullHex: string;
  last12Hex: string;
  decimal: number;
}

/**
 * Parse BLE notification data for pose information
 * @param characteristicValue - Base64 encoded characteristic value
 * @returns Parsed pose data object
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

    // Parse last 12 characters (6 bytes)
    const last12Chars = hexString.slice(-12);

    // Convert hex to decimal
    const decimalValue = parseInt(last12Chars, 16);

    // Create data object
    return {
      fullHex: hexString,
      last12Hex: last12Chars,
      decimal: decimalValue
    };
  } catch (error) {
    console.error('Error parsing pose data:', error);
    return null;
  }
};