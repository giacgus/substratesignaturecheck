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
		"  If no args are provided, defaults to processing examples/batch.json\n" +
		"  Also supports loose format: lines like [message,signature,ss58] without quotes"
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

function tryParseStrictJson(content: string): Array<[string, string, string]> | null {
	try {
		const parsed = JSON.parse(content);
		if (Array.isArray(parsed) && parsed.every((x) => Array.isArray(x) && x.length === 3)) {
			return parsed as Array<[string, string, string]>;
		}
		return null;
	} catch {
		return null;
	}
}

function parseLooseTriplets(content: string): Array<[string, string, string]> {
	// Extract inner bracket groups like [a,b,c] even if there is an outer wrapper or missing commas
	const triplets: Array<[string, string, string]> = [];
	const regex = /\[([^\[\]]+)\]/g;
	let match: RegExpExecArray | null;
	while ((match = regex.exec(content)) !== null) {
		const inner = match[1];
		const parts = inner.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
		if (parts.length === 3) {
			triplets.push([parts[0], parts[1], parts[2]]);
		}
	}
	if (triplets.length === 0) {
		throw new Error("Could not parse loose format; expected [message,signature,ss58] lines");
	}
	return triplets;
}

function parseBatchFileContent(content: string): Array<[string, string, string]> {
	const strict = tryParseStrictJson(content);
	if (strict) return strict;
	return parseLooseTriplets(content);
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

	let content: string;
	try {
		content = fs.readFileSync(resolvedPath, "utf8");
	} catch (e) {
		console.error("Failed to read batch file:", e);
		return 1;
	}

	let items: Array<[string, string, string]>;
	try {
		items = parseBatchFileContent(content);
	} catch (e) {
		console.error("Failed to parse batch file:", e);
		return 1;
	}

	const valid: Array<any> = [];
	const invalid: Array<any> = [];

	for (let i = 0; i < items.length; i++) {
		const [messageArg, signatureArg, ss58] = items[i];
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
			invalid.push({ index: i, error: String(e), item: items[i] });
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
