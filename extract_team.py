#!/usr/bin/env python3
"""
extract_team.py -- Extract Team IDs, app IDs, and device UDIDs from iOS provisioning profiles
Usage: python3 extract_team.py profile.mobileprovision --format json
       python3 extract_team.py profile.mobileprovision --devices
"""
import subprocess, plistlib, sys, json, argparse

def parse_profile(path):
    with open(path, 'rb') as f:
        data = f.read()
    
    # Extract plist from the CMS container
    start = data.find(b'<?xml')
    end = data.rfind(b'</plist>') + 8
    if start < 0 or end <= start:
        raise ValueError("Could not find plist in provisioning profile")
    
    plist_data = data[start:end]
    plist = plistlib.loads(plist_data)
    return plist

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('profile', help='Path to .mobileprovision file')
    parser.add_argument('--format', default='text', choices=['text', 'json', 'csv'])
    parser.add_argument('--devices', action='store_true', help='Show device UDIDs only')
    parser.add_argument('--team', action='store_true', help='Show team info only')
    args = parser.parse_args()

    try:
        plist = parse_profile(args.profile)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

    team_id = plist.get('TeamIdentifier', [''])[0] if isinstance(plist.get('TeamIdentifier'), list) else plist.get('TeamIdentifier', '')
    team_name = plist.get('TeamName', '')
    app_id = plist.get('Entitlements', {}).get('application-identifier', '')
    devices = plist.get('ProvisionedDevices', [])
    
    if args.devices:
        for d in devices:
            print(d)
        return

    if args.team:
        print(f"Team ID: {team_id}")
        print(f"Team Name: {team_name}")
        print(f"App ID: {app_id}")
        return

    if args.format == 'json':
        print(json.dumps({
            'team_id': team_id,
            'team_name': team_name,
            'app_id': app_id,
            'device_count': len(devices),
            'devices': devices,
        }, indent=2))
    elif args.format == 'csv':
        print("UDID,Team,App")
        for d in devices:
            print(f"{d},{team_id},{app_id}")
    else:
        print(f"Team ID: {team_id}")
        print(f"Team Name: {team_name}")
        print(f"App ID Prefix: {app_id.split('.')[-1] if app_id else 'N/A'}")
        print(f"Devices: {len(devices)}")
        if len(devices) <= 10:
            for d in devices:
                print(f"  • {d}")
        else:
            for d in devices[:5]:
                print(f"  • {d}")
            print(f"  ... and {len(devices) - 5} more")

if __name__ == "__main__":
    main()
