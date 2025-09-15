## Substrate Signature Verifier (Polkadot{.js} compatible)

Verify messages signed with the PolkadotJS browser extension or any Substrate keypair.

### Features
- Supports sr25519, ed25519, ecdsa via `@polkadot/util-crypto`
- Accepts message and signature as raw string, hex (`0x...`), or base64
- Accepts SS58 address or 32-byte public key (hex/base64)
- Exit codes: 0 = valid, 2 = invalid, 1 = error

### Prerequisites
- Node.js 18+ and npm

### Setup
```bash
npm install
npm run build
```

### CLI Usage
```bash
node dist/cli.js <message> <signature> <address_or_publicKey>
```
- message: raw string, hex (0x...), or base64
- signature: hex (0x...) or base64
- address_or_publicKey: SS58 address (from PolkadotJS) or 32-byte public key

### Examples
- Verify a simple string message signed in PolkadotJS:
```bash
node dist/cli.js "hello" 0x<signature_hex> <SS58_ADDRESS>
```
- Hex-encoded message and base64 signature:
```bash
node dist/cli.js 0x68656c6c6f <signature_base64> <SS58_ADDRESS>
```

The tool automatically detects the crypto type from the signature and key.

### Programmatic usage (optional)
You can import the CLI file or adapt its core logic. The main call is:
```ts
import { signatureVerify, cryptoWaitReady } from "@polkadot/util-crypto";
await cryptoWaitReady();
const { isValid, crypto, publicKey } = signatureVerify(messageU8a, signatureU8a, ss58OrPublicKey);
```

### License
MIT
