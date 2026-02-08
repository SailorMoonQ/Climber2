# Testing Notes for Bluetooth Fix

## Problem
When navigating back from the free-training page, the app crashes with a NullPointerException related to Bluetooth operations.

## Root Cause
The issue was caused by improper cleanup of Bluetooth resources when the component was unmounted. Specifically:
1. Some Bluetooth services were directly calling device methods instead of using the BLEService singleton
2. Subscriptions were not being properly tracked and cleaned up
3. Null parameters were being passed to Bluetooth library methods

## Fixes Implemented

### 1. KYTOHeartRateService (`services/kyto-heartrate-service.ts`)
- Modified `connectToDevice` to use `BLEService.connectToDevice`
- Modified `startHeartRateNotifications` to use `BLEService.startNotifications`
- Modified `disconnect` to use `BLEService.disconnectFromDevice`

### 2. BLEService (`services/bluetooth.ts`)
- Improved `startNotifications` to use more specific subscription keys
- Enhanced `stopNotifications` to remove all subscriptions for a device
- Improved `handleConnectionLoss` with null safety checks
- Enhanced `clearAllSubscriptions` with better error handling

### 3. FreeTrainingScreen (`app/free-training.tsx`)
- Enhanced cleanup logic to stop training and properly clean all Bluetooth resources
- Added detailed logging for debugging

### 4. useBluetooth Hook (`hooks/useBluetooth.ts`)
- Modified to use `BLEService.startNotifications` instead of direct device calls

## Verification
Test the following scenarios:
1. Navigate to free-training page
2. Start training
3. Navigate back to previous page
4. Verify no crash occurs
5. Repeat with Bluetooth devices connected