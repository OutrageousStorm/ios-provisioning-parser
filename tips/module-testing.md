# Testing Xposed/LSPosed Modules

Best practices for testing custom Xposed modules before release.

## Pre-test checklist

- [ ] Module scoped to correct app(s)
- [ ] No hardcoded package names or test code
- [ ] Permissions declared if needed
- [ ] No debug logging left in (or make it conditional)
- [ ] Tested on target Android version
- [ ] Tested with Zygisk enabled AND disabled
- [ ] Works after device reboot

## Testing process

### 1. Build and install
```bash
# Build module ZIP
./gradlew assembleRelease

# Install via Magisk Manager
# Or via adb: adb push module.zip /sdcard/
# Then install in Magisk app
```

### 2. Enable in LSPosed
- Open LSPosed Manager
- Enable module
- Select scope apps (if not system-wide)
- Reboot

### 3. Basic function test
- Use target app normally
- Check if expected behavior occurs
- Look for crashes in logcat

### 4. Logcat inspection
```bash
# Real-time logs
adb logcat | grep -E "LSPosed|YourModuleTag|AndroidRuntime"

# Search for your module errors
adb logcat | grep "your_module_name"
```

### 5. Disable test
- Disable in LSPosed Manager
- Reboot
- Verify old behavior returns

### 6. Scope test (if applicable)
- Test with module scoped to one app
- Test disabled for that app
- Test enabled for multiple apps simultaneously

## Common issues

| Issue | Solution |
|-------|----------|
| Module not appearing in LSPosed | Check manifest, verify Xposed SDK version |
| Crashes on app launch | Check logcat for ClassNotFoundException or MethodNotFoundException |
| Changes don't take effect after reboot | Ensure module is saved in LSPosed, reboot again |
| Works sometimes, not always | Check if you're hooking the right method overload |
| Performance degradation | Profile with Android Profiler, optimize hooks |

## Release checklist
- [ ] Tested on 2+ devices/API levels
- [ ] Logcat clean (no errors or warnings)
- [ ] Performance acceptable
- [ ] Works with latest LSPosed version
- [ ] Readme with clear instructions
- [ ] Version number bumped
- [ ] Changelog updated
