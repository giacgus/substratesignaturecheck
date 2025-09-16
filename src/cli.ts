#!/usr/bin/env node
import { hexToU8a, isHex, stringToU8a, u8aToU8a } from "@polkadot/util";
import { cryptoWaitReady, signatureVerify } from "@polkadot/util-crypto";
import fs from "fs";
import path from "path";

function parseU8a(input: string): Uint8Array {
	if (isHex(input)) return hexToU8a(input);
	try {
		return u8aToU8a(Buffer.from(input, "base64"));
	} catch { }
	return stringToU8a(input);
}

function printUsage(): void {
	console.log(
		"Usage: verify <message> <signature> <address_or_publicKey>\n\n" +
		"- message: raw string, hex (0x...), or base64\n" +
		"- signature: hex (0x...) or base64\n" +
		"- address_or_publicKey: SS58 address or 32-byte public key (hex/base64)\n\n" +
		"Batch mode:\n" +
		"  verify --file <path-to-json-array>\n" +
		"  If no args are provided, defaults to processing examples/batch.json"
	);
}

async function verifyOne(messageArg: string, signatureArg: string, addressArg: string) {
	const message = parseU8a(messageArg);
	const signature = parseU8a(signatureArg);
	const signer = addressArg;
	const result = signatureVerify(message, signature, signer);
	const pkHex = "0x" + Buffer.from(result.publicKey).toString("hex");
	return { ...result, publicKeyHex: pkHex };
}

async function runSingle(): Promise<number> {
	const [, , messageArg, signatureArg, addressArg] = process.argv;
	if (!messageArg || !signatureArg || !addressArg) {
		printUsage();
		return 1;
	}

	await cryptoWaitReady();
	const result = await verifyOne(messageArg, signatureArg, addressArg);
	console.log(
		JSON.stringify(
			{ isValid: result.isValid, crypto: result.crypto, publicKey: result.publicKeyHex },
			null,
			2
		)
	);
	return result.isValid ? 0 : 2;
}

async function runBatch(filePath?: string): Promise<number> {
	await cryptoWaitReady();
	const resolvedPath = filePath
		? path.resolve(filePath)
		: path.resolve(process.cwd(), "examples", "batch.json");

	if (!fs.existsSync(resolvedPath)) {
		console.error(`Batch file not found: ${resolvedPath}`);
		return 1;
	}

	let data: unknown;
	try {
		const content = fs.readFileSync(resolvedPath, "utf8");
		data = JSON.parse(content);
	} catch (e) {
		console.error("Failed to read/parse batch file:", e);
		return 1;
	}

	if (!Array.isArray(data)) {
		console.error("Batch file must be a JSON array of [message, signature, ss58]");
		return 1;
	}

	const valid: Array<any> = [];
	const invalid: Array<any> = [];

	for (let i = 0; i < data.length; i++) {
		const item = (data as any[])[i];
		if (!Array.isArray(item) || item.length !== 3) {
			invalid.push({ index: i, error: "Item must be [message, signature, ss58]", item });
			continue;
		}
		const [messageArg, signatureArg, ss58] = item as [string, string, string];
		try {
			const result = await verifyOne(messageArg, signatureArg, ss58);
			const entry = {
				index: i,
				message: messageArg,
				signature: signatureArg,
				ss58,
				isValid: result.isValid,
				crypto: result.crypto,
				publicKey: result.publicKeyHex,
			};
			(result.isValid ? valid : invalid).push(entry);
		} catch (e) {
			invalid.push({ index: i, error: String(e), item });
		}
	}

	console.log(JSON.stringify({ valid, invalid }, null, 2));
	return invalid.length === 0 ? 0 : 2;
}

async function main(): Promise<void> {
	const args = process.argv.slice(2);
	// batch flags
	const fileFlagIndex = args.indexOf("--file");
	if (fileFlagIndex !== -1) {
		const filePath = args[fileFlagIndex + 1];
		const code = await runBatch(filePath);
		process.exit(code);
		return;
	}

	// no args → run default batch example
	if (args.length === 0) {
		const code = await runBatch();
		process.exit(code);
		return;
	}

	// otherwise treat as single-check mode
	const code = await runSingle();
	process.exit(code);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
