#!/usr/bin/env node
/**
 * parse.js — Parse iOS .mobileprovision files
 * Usage: node parse.js path/to/profile.mobileprovision
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const profilePath = process.argv[2];
if (!profilePath || !fs.existsSync(profilePath)) {
  console.error('Usage: node parse.js <path-to-.mobileprovision>');
  process.exit(1);
}

// .mobileprovision is a PKCS#7 SignedData structure
// Extract the embedded plist using OpenSSL
const cmds = [
  // Convert DER to PEM
  `security cms -D -i "${profilePath}" -o /tmp/provision.plist 2>/dev/null || openssl cms -inform DER -in "${profilePath}" -out /tmp/provision.plist -outform PEM 2>/dev/null`,
  // Or directly extract
  `openssl asn1parse -in "${profilePath}" -inform DER -strparse 4 2>/dev/null | grep plist || true`,
];

let plistContent = '';
for (const cmd of cmds) {
  try {
    const result = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
    if (result.includes('plist')) {
      plistContent = result;
      break;
    }
  } catch(e) {}
}

// Alternative: use macOS security binary if available
if (!plistContent) {
  try {
    execSync(`security cms -D -i "${profilePath}" -o /tmp/plist.txt 2>/dev/null`);
    plistContent = fs.readFileSync('/tmp/plist.txt', 'utf8');
  } catch(e) {
    // Fallback: manual binary parsing
    const buf = fs.readFileSync(profilePath);
    const start = buf.indexOf(Buffer.from('<?xml'));
    const end = buf.indexOf(Buffer.from('</plist>'));
    if (start >= 0 && end > start) {
      plistContent = buf.toString('utf8', start, end + 8);
    }
  }
}

if (!plistContent) {
  console.error('Could not extract plist. Try: security cms -D -i <file> -o out.plist');
  process.exit(1);
}

// Parse the plist (basic key extraction)
const parseValue = (str) => {
  const keyMatch = str.match(/<key>([^<]+)<\/key>\s*<([^>]+)>([^<]*)</g);
  return keyMatch || [];
};

console.log('\n📱 iOS Provisioning Profile\n');
console.log(`File: ${path.basename(profilePath)}`);

// Extract key info
const nameMatch = plistContent.match(/<key>Name<\/key>\s*<string>([^<]+)<\/string>/);
const uuidMatch = plistContent.match(/<key>UUID<\/key>\s*<string>([^<]+)<\/string>/);
const typeMatch = plistContent.match(/<key>ProvisionedDevices<\/key>/);
const expiryMatch = plistContent.match(/<key>ExpirationDate<\/key>\s*<date>([^<]+)<\/date>/);

if (nameMatch) console.log(`Name: ${nameMatch[1]}`);
if (uuidMatch) console.log(`UUID: ${uuidMatch[1]}`);
if (expiryMatch) {
  const expDate = new Date(expiryMatch[1]);
  const isValid = expDate > new Date();
  console.log(`Expires: ${expDate.toISOString()} ${isValid ? '✅' : '❌ EXPIRED'}`);
}

// List provisioned devices
const devicesMatch = plistContent.match(/<key>ProvisionedDevices<\/key>\s*<array>([\s\S]*?)<\/array>/);
if (devicesMatch) {
  const deviceList = devicesMatch[1].match(/<string>([^<]+)<\/string>/g) || [];
  console.log(`\nProvisioned Devices (${deviceList.length}):`);
  deviceList.slice(0, 10).forEach((dev, i) => {
    const udid = dev.match(/>([^<]+)<\/string>/)[1];
    console.log(`  ${i+1}. ${udid}`);
  });
  if (deviceList.length > 10) console.log(`  ... and ${deviceList.length - 10} more`);
}

// Entitlements
const entsMatch = plistContent.match(/<key>Entitlements<\/key>\s*<dict>([\s\S]*?)<\/dict>/);
if (entsMatch) {
  const ents = entsMatch[1].match(/<key>([^<]+)<\/key>/g) || [];
  console.log(`\nEntitlements (${ents.length}):`);
  ents.slice(0, 10).forEach(e => {
    const name = e.match(/>([^<]+)<\/key>/)[1];
    console.log(`  • ${name}`);
  });
  if (ents.length > 10) console.log(`  ... and ${ents.length - 10} more`);
}

console.log('\n✅ Done. Full plist saved to: /tmp/plist.txt');
