# 🔐 iOS Provisioning Profile Parser

Extract certificate, entitlement, and expiry info from `.mobileprovision` files without Xcode.

## Usage
```bash
npm install -g ios-provisioning-parser

parse-provisioning-profile MyApp.mobileprovision
# Shows: team ID, bundle IDs, expiry, certificates, entitlements
```

## Features
- No Xcode or macOS required
- Inspect entitlements before installing
- Check expiry dates
- Export as JSON/CSV
