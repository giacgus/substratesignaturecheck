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

### Batch Usage (files)
- JSON array format (strict): file contains an array of triplets `[message, signature, ss58]`.
Example: `examples/sample_json.json`
```json
[
  [
    "0xC1b7685B4D7e7D27fca2637A6396645Be3647b2d",
    "0x8874cc5c...06ab88",
    "5DXfbMZVxxwYuy1ZrFxbLnqJjWXSqXfR62Rc5HRVQcpMmW2X"
  ]
]
```
- Loose format (no quotes, optional commas, each line a bracketed triplet) is also supported.
Example: `examples/sample_loose.txt`
```
[[0xC1b7685B4D7e7D27fca2637A6396645Be3647b2d,0x38502bd4f0...,5F2KNYky1XfrF2nPk9J7VGKNattENsh1ncRvKbHv1VZeW9qF]
[0x3C7b4Fa85d67DF84b3D41205729AfaE30c1d4f02,0x38502bd4f0...,5F2KNYky1XfrF2nPk9J7VGKNattENsh1ncRvKbHv1VZeW9qF]]
```

Run on a file:
```bash
node dist/cli.js --file path/to/your-file
```
- If you run with no args, it defaults to `examples/sample_json.json`.
```bash
node dist/cli.js
```

### Quick copy-paste (use these directly)
- Use the included strict JSON sample:
```bash
node dist/cli.js --file ./examples/sample_json.json
```
- Use the included loose-format sample:
```bash
node dist/cli.js --file ./examples/sample_loose.txt
```
- Use your own file (replace with your path):
```bash
node dist/cli.js --file ./path/to/your_file.json
# or loose format
node dist/cli.js --file ./path/to/your_file.txt
```

Output is printed as JSON to stdout, grouped by validity:
```json
{
  "valid": [ { /* item with isValid=true */ } ],
  "invalid": [ { /* item with isValid=false or parse errors */ } ]
}
```
- Save output to a file:
```bash
node dist/cli.js --file path/to/your-file > results.json
```
- Exit codes: 0 if all valid, 2 if at least one invalid, 1 on errors (parse, missing file, etc.).

### Programmatic usage (optional)
You can import the CLI file or adapt its core logic. The main call is:
```ts
import { signatureVerify, cryptoWaitReady } from "@polkadot/util-crypto";
await cryptoWaitReady();
const { isValid, crypto, publicKey } = signatureVerify(messageU8a, signatureU8a, ss58OrPublicKey);
```

### License
MIT
