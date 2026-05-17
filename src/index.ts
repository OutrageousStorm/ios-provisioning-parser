/**
 * Parse iOS provisioning profiles
 * Usage: parse-provisioning-profile <file.mobileprovision>
 */
import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { parse } from 'plist';

interface ProvisioningProfile {
    UUID: string;
    Name: string;
    TeamIdentifier: string[];
    TeamName: string;
    AppIDName: string;
    Entitlements: Record<string, any>;
    ExpirationDate: Date;
    CreationDate: Date;
    DeveloperCertificates: Buffer[];
    ProvisionedDevices: string[];
}

export function parseProfile(filePath: string): ProvisioningProfile {
    // Provisioning profiles are CMSAsn1 encoded with an embedded plist
    // Extract the plist using OpenSSL
    const decoded = execSync(
        `openssl cms -in "${filePath}" -inform DER -verify -noverify -out /dev/stdout 2>/dev/null`
    ).toString();
    
    const plist = parse(decoded) as ProvisioningProfile;
    
    return {
        UUID: plist.UUID,
        Name: plist.Name,
        TeamIdentifier: plist.TeamIdentifier,
        TeamName: plist.TeamName,
        AppIDName: plist.AppIDName,
        Entitlements: plist.Entitlements,
        ExpirationDate: plist.ExpirationDate,
        CreationDate: plist.CreationDate,
        DeveloperCertificates: plist.DeveloperCertificates,
        ProvisionedDevices: plist.ProvisionedDevices || [],
    };
}

export function displayProfile(profile: ProvisioningProfile): void {
    console.log(`Name:          ${profile.Name}`);
    console.log(`UUID:          ${profile.UUID}`);
    console.log(`Team:          ${profile.TeamName}`);
    console.log(`App ID:        ${profile.AppIDName}`);
    console.log(`Created:       ${profile.CreationDate.toLocaleDateString()}`);
    console.log(`Expires:       ${profile.ExpirationDate.toLocaleDateString()}`);
    console.log(`Devices:       ${profile.ProvisionedDevices.length}`);
    console.log(`Entitlements:`);
    Object.entries(profile.Entitlements).forEach(([key, val]) => {
        console.log(`  ${key}: ${JSON.stringify(val)}`);
    });
}

if (require.main === module) {
    const file = process.argv[2];
    if (!file) {
        console.error('Usage: ts-node index.ts <profile.mobileprovision>');
        process.exit(1);
    }
    const profile = parseProfile(file);
    displayProfile(profile);
}
