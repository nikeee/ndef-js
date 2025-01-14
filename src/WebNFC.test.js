// @ts-check

import * as assert from "node:assert";
import { describe, it } from "node:test";

import * as ndef from "./WebNFC.js";

describe("empty messages", () => {
	it("should encode correctly", () => {
		const message = ndef.createNdefMessage({
			records: [
				{
					recordType: "empty",
				},
			],
		});

		assert.deepEqual(message, {
			records: [
				{
					recordType: "empty",
					id: null,
					lang: null,
					encoding: null,
					mediaType: null,
					data: null,
				},
			],
		});

		const encoded = ndef.encodeNdefMessage(message);
		assert.deepEqual(encoded, new Uint8Array([0xd0, 0x00, 0x00]).buffer);
	});
});
