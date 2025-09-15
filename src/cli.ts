#!/usr/bin/env node
import { hexToU8a, isHex, stringToU8a, u8aToU8a } from "@polkadot/util";
import { cryptoWaitReady, signatureVerify } from "@polkadot/util-crypto";

function parseU8a(input: string): Uint8Array {
	if (isHex(input)) return hexToU8a(input);
	try {
		return u8aToU8a(Buffer.from(input, "base64"));
	} catch {}
	return stringToU8a(input);
}

function printUsage(): void {
	console.log(
		"Usage: verify <message> <signature> <address_or_publicKey>\n\n" +
		"- message: raw string, hex (0x...), or base64\n" +
		"- signature: hex (0x...) or base64\n" +
		"- address_or_publicKey: SS58 address or 32-byte public key (hex/base64)"
	);
}

async function main(): Promise<void> {
	const [, , messageArg, signatureArg, addressArg] = process.argv;
	if (!messageArg || !signatureArg || !addressArg) {
		printUsage();
		process.exit(1);
	}

	await cryptoWaitReady();

	const message = parseU8a(messageArg);
	const signature = parseU8a(signatureArg);
	const signer = addressArg;

	const result = signatureVerify(message, signature, signer);
	const pkHex = "0x" + Buffer.from(result.publicKey).toString("hex");
	console.log(JSON.stringify({ isValid: result.isValid, crypto: result.crypto, publicKey: pkHex }, null, 2));
	process.exit(result.isValid ? 0 : 2);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
