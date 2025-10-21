# Windows Code Signing - Research & Requirements

## The Problem

When users download and install Vibe Hub on Windows, they see a security warning from Microsoft SmartScreen saying "Windows protected your PC" with "Unknown publisher". This happens because the app is not code-signed with a trusted certificate.

## What is Code Signing?

Code signing is a cryptographic process that proves the software comes from a verified publisher and hasn't been tampered with. It removes the scary security warnings users see when installing apps.

## Current Options (2025)

### Option 1: OV (Organization Validation) Certificate
- **Cost:** $215-520/year (ongoing)
- **Requirements:**
  - Available to individuals
  - Requires hardware security module (HSM) or USB token (mandatory since June 2023)
  - Takes 1-3 days for verification and issuance
  - Must be renewed annually
- **Result:**
  - Still shows SmartScreen warning initially
  - Builds reputation over time with Microsoft
  - Warning eventually goes away after enough users install it

### Option 2: EV (Extended Validation) Certificate
- **Cost:** $400+/year (ongoing)
- **Requirements:**
  - May require a business entity (not available to all individuals)
  - Requires hardware security module (HSM)
  - More stringent verification process
  - Must be renewed annually
- **Result:**
  - **Immediate reputation** with Microsoft SmartScreen
  - No warnings shown to users from day one
  - Best user experience

### Option 3: Azure Trusted Signing (New for 2025)
- **Cost:** Relatively cheap (pay-per-use model)
- **Requirements:**
  - Microsoft Azure account
  - Cloud-based signing (no hardware token needed)
  - Currently has limited Tauri support (feature request pending)
- **Result:**
  - Cloud-based, modern approach
  - May become the recommended method in the future

### Option 4: Do Nothing
- **Cost:** Free
- **Requirements:** None
- **Result:**
  - Users see security warnings
  - More friction for downloads/installs
  - Not ideal for public distribution
  - Fine for personal use or technical users

## Implementation Complexity

### If We Purchase a Certificate

**Steps required:**
1. Purchase certificate from a CA (Certificate Authority) like Sectigo, DigiCert, etc.
2. Complete identity verification process (1-3 days)
3. Receive hardware USB token in the mail
4. Configure Tauri build process to sign during compilation
5. Update CI/CD pipeline if using automated builds
6. Manage certificate renewal annually

**Tauri Integration:**
- Tauri has built-in support for code signing
- Configuration goes in `tauri.conf.json`
- For newer certificates (post-2023), may need custom signing tools
- See: https://v2.tauri.app/distribute/sign/windows/

## Recommendation

### For Now: Option 4 (Do Nothing)
**Reasoning:**
- Vibe Hub is currently for personal use / technical users
- Users downloading from GitHub understand they need to bypass the warning
- $215-400/year is significant ongoing cost
- Requires business process (verification, renewal, hardware token management)

### Future Consideration: Option 3 (Azure Trusted Signing)
**Reasoning:**
- If Vibe Hub becomes more widely distributed
- When Tauri adds better support for Azure Trusted Signing
- More cost-effective than traditional certificates
- Easier to manage (no hardware tokens)

### If Public Distribution Becomes Important: Option 2 (EV Certificate)
**Reasoning:**
- Best user experience (no warnings)
- Worth the cost if downloading friction is hurting adoption
- Requires business setup but provides immediate credibility

## Technical Implementation Notes

**For OV/EV Certificates:**
```json
// tauri.conf.json
{
  "bundle": {
    "windows": {
      "certificateThumbprint": "YOUR_CERT_THUMBPRINT",
      "digestAlgorithm": "sha256",
      "timestampUrl": "http://timestamp.digicert.com"
    }
  }
}
```

**Important:** Certificates issued after June 1, 2023 require HSM storage and may need custom signing workflows beyond Tauri's built-in support.

## Resources

- Tauri Windows Code Signing Guide: https://v2.tauri.app/distribute/sign/windows/
- CA/B Forum Requirements (2023 changes): Requires HSM for all code signing keys
- Azure Trusted Signing: https://github.com/tauri-apps/tauri/issues/9578

## Decision

**Status:** No code signing implemented (as of 2025)

**Rationale:** Cost and complexity outweigh benefits for current use case (personal/technical users). Will revisit if the app is distributed more widely.

**User Impact:** Users must click through "Unknown publisher" warning when installing. This is expected for unsigned Windows applications.
