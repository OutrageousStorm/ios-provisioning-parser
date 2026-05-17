# 📱 iOS Provisioning Profile Parser

Parse `.mobileprovision` files without Xcode. Extract certificates, entitlements, devices, and expiry dates.

## Usage

```bash
npm install
npm run parse path/to/profile.mobileprovision
npm run verify path/to/profile.mobileprovision path/to/app.ipa
```

## What it does

- ✅ Decodes DER-encoded provisioning profiles
- ✅ Extracts all certificates with expiry checks
- ✅ Lists provisioned devices and their UDIDs
- ✅ Shows entitlements (push notifications, iCloud, etc.)
- ✅ Validates signature chain
