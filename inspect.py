#!/usr/bin/env python3
"""
inspect.py -- Parse iOS provisioning profiles (mobileprovision files)
No Xcode needed. Extracts certificates, entitlements, device UDIDs.
Usage: python3 inspect.py profile.mobileprovision
"""
import sys, plistlib, base64, subprocess

def parse_mobileprovision(file_path):
    """Extract data from .mobileprovision file"""
    with open(file_path, 'rb') as f:
        content = f.read()
    
    # Extract plist from between markers
    start = content.find(b'<plist')
    end = content.find(b'</plist>') + len(b'</plist>')
    if start == -1:
        print("❌ Not a valid provisioning profile")
        return None
    
    plist_data = content[start:end]
    profile = plistlib.loads(plist_data)
    return profile

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 inspect.py <profile.mobileprovision>")
        sys.exit(1)

    profile = parse_mobileprovision(sys.argv[1])
    if not profile:
        return

    print(f"\n📱 iOS Provisioning Profile Inspector\n")
    
    # Basic info
    app_id = profile.get('Entitlements', {}).get('application-identifier', 'N/A')
    team_id = profile.get('TeamIdentifier', ['N/A'])[0]
    name = profile.get('Name', 'Unknown')
    exp_date = profile.get('ExpirationDate', 'N/A')
    
    print(f"Profile name:     {name}")
    print(f"Team ID:          {team_id}")
    print(f"App ID:           {app_id}")
    print(f"Expires:          {exp_date}\n")

    # Certificates
    certs = profile.get('DeveloperCertificates', [])
    print(f"📜 Certificates ({len(certs)}):")
    for i, cert_data in enumerate(certs, 1):
        # Parse X.509 cert (simplified)
        print(f"  {i}. [Binary certificate {len(cert_data)} bytes]")

    # Entitlements
    ents = profile.get('Entitlements', {})
    print(f"\n🔑 Entitlements ({len(ents)}):")
    for key, val in sorted(ents.items())[:15]:
        print(f"  • {key}: {val}")

    # Provisioned devices
    devices = profile.get('ProvisionedDevices', [])
    print(f"\n📲 Provisioned Devices ({len(devices)}):")
    for udid in devices[:10]:
        print(f"  • {udid}")

    # Capabilities
    caps = ents.get('com.apple.developer.associated-domains', [])
    if caps:
        print(f"\n🌐 Associated Domains:")
        for cap in caps:
            print(f"  • {cap}")

    print()

if __name__ == "__main__":
    main()
