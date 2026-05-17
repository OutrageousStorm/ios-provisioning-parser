#!/usr/bin/env node
import { parseProvisioningProfile, listAllProfiles, findProfileByBundleId } from './parser';
import * as fs from 'fs';

const cmd = process.argv[2];
const arg = process.argv[3];

if (cmd === 'parse' && arg) {
  try {
    const profile = parseProvisioningProfile(arg);
    console.log('\n📱 Provisioning Profile');
    console.log(`  Name:       ${profile.name}`);
    console.log(`  Team:       ${profile.teamName} (${profile.teamId})`);
    console.log(`  Bundle ID:  ${profile.bundleId}`);
    console.log(`  App ID:     ${profile.appId}`);
    console.log(`  Created:    ${profile.creationDate.toLocaleDateString()}`);
    console.log(`  Expires:    ${profile.expirationDate.toLocaleDateString()} ${profile.isExpired ? '❌ EXPIRED' : '✅'}`);
    console.log(`  Devices:    ${profile.devices.length}`);
    console.log(`  Entitlements: ${Object.keys(profile.entitlements).length}`);
    console.log('');
  } catch (e) {
    console.error('❌', (e as Error).message);
  }
} else if (cmd === 'list') {
  const profiles = listAllProfiles();
  if (!profiles.length) {
    console.log('No provisioning profiles found.');
    return;
  }
  console.log(`\n📋 ${profiles.length} Provisioning Profiles\n`);
  console.log('Profile                                Team ID  Bundle ID                       Expires');
  console.log('─'.repeat(100));
  profiles.forEach(p => {
    const expired = p.isExpired ? ' ❌' : '   ';
    const expiresStr = p.expirationDate.toLocaleDateString().substring(0, 10);
    console.log(`${p.name.padEnd(35)} ${p.teamId.padEnd(8)} ${(p.bundleId || 'N/A').substring(0, 29).padEnd(30)} ${expiresStr}${expired}`);
  });
  console.log('');
} else if (cmd === 'find' && arg) {
  const profile = findProfileByBundleId(arg);
  if (profile) {
    console.log(`\n✅ Found for ${arg}:\n  ${profile.name} (${profile.teamName})`);
    console.log(`  Devices: ${profile.devices.length}`);
    console.log(`  Expires: ${profile.expirationDate.toLocaleDateString()}\n`);
  } else {
    console.log(`\n❌ No profile found for ${arg}`);
  }
} else {
  console.log(`
iOS Provisioning Profile Parser

Usage:
  npx ios-provisioning-parser parse <file>    Parse a specific .mobileprovision file
  npx ios-provisioning-parser list             List all installed provisioning profiles
  npx ios-provisioning-parser find <bundleId>  Find profile by app bundle ID

Example:
  npx ios-provisioning-parser list
  npx ios-provisioning-parser find com.example.myapp
  `);
}
