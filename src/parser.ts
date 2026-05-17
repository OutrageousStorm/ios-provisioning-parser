/**
 * iOS Provisioning Profile Parser
 * Extracts device UDIDs, team info, entitlements from .mobileprovision files
 * Provisioning profiles are PKCS#7 (CMS) signed messages containing a plist
 */
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as plist from 'plist';

interface ProvisioningProfile {
  name: string;
  teamName: string;
  teamId: string;
  appId: string;
  bundleId: string;
  expirationDate: Date;
  creationDate: Date;
  devices: string[];
  entitlements: Record<string, any>;
  isExpired: boolean;
}

export function parseProvisioningProfile(filePath: string): ProvisioningProfile {
  // Extract plist from PKCS#7 container
  let plistData: string;
  
  try {
    // Use openssl to extract the plist from the DER-encoded PKCS#7
    const output = execSync(
      `openssl cms -inform DER -in "${filePath}" -verify -noverify -text -outform pem`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
    );
    
    // Extract plist between markers
    const match = output.match(/<?xml[\s\S]*<\/plist>/);
    if (!match) throw new Error('No plist found in provisioning profile');
    plistData = match[0];
  } catch (e) {
    throw new Error(`Failed to extract plist: ${(e as Error).message}`);
  }

  const profile = plist.parse(plistData) as any;
  const now = new Date();

  return {
    name: profile.Name || '',
    teamName: profile.TeamName || '',
    teamId: profile.TeamIdentifier?.[0] || '',
    appId: profile.Entitlements?.['application-identifier'] || '',
    bundleId: profile.Entitlements?.['application-identifier']?.split('.')?.slice(1)?.join('.') || '',
    expirationDate: profile.ExpirationDate || new Date(),
    creationDate: profile.CreationDate || new Date(),
    devices: profile.ProvisionedDevices || [],
    entitlements: profile.Entitlements || {},
    isExpired: (profile.ExpirationDate || new Date()) < now,
  };
}

export function listAllProfiles(): ProvisioningProfile[] {
  const homeDir = process.env.HOME || '/Users/nobody';
  const profilesDir = `${homeDir}/Library/MobileDevice/Provisioning Profiles`;
  
  if (!fs.existsSync(profilesDir)) {
    return [];
  }

  const files = fs.readdirSync(profilesDir).filter(f => f.endsWith('.mobileprovision'));
  return files.map(f => parseProvisioningProfile(`${profilesDir}/${f}`)).sort((a, b) => 
    (b.expirationDate.getTime() - a.expirationDate.getTime())
  );
}

export function findProfileByBundleId(bundleId: string): ProvisioningProfile | null {
  const profiles = listAllProfiles();
  return profiles.find(p => p.bundleId === bundleId || p.appId.includes(bundleId)) || null;
}
