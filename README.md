## Substrate Signature Verifier (Polkadot{.js} compatible)

Verify messages signed with the PolkadotJS extension or any Substrate keypair.

### Quick start
```bash
npm install
npm run build
```

### Run with your file (recommended)
- Loose format (each line is `[message,signature,ss58]`, no quotes required):
```bash
node dist/cli.js --file ./examples/sample_loose.txt > output/results.json
```
- Strict JSON format (array of triplets):
```bash
node dist/cli.js --file ./examples/sample_json.json > output/results.json
```

Notes
- Output: printed to stdout as JSON. Redirect to a file as shown above.
- Exit codes: `0` all valid, `2` some invalid, `1` errors (parse, missing file, etc.).
- Default: running with no args uses `examples/sample_json.json`.

### Single check (optional)
```bash
node dist/cli.js <message> <signature> <ss58>
```

That’s it. Use the loose file for easy copy-paste, or JSON if you prefer strict formatting.
