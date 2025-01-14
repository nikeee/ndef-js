// @ts-check

import * as assert from "node:assert";
import { describe, it } from "node:test";

import * as ndef from "./WebNFC.js";

const encoder = new TextEncoder();
const textBuffer = (/** @type {string} */ text) => encoder.encode(text).buffer;

describe("should encode correctly", () => {
	it("empty messages", () => {
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

	it("text message", () => {
		const message = ndef.createNdefMessage({
			records: [
				{
					recordType: "text",
					data: "hello, world",
				},
			],
		});

		assert.deepEqual(message, {
			records: [
				{
					recordType: "text",
					id: null,
					lang: "en",
					encoding: "utf-8",
					mediaType: null,
					data: new DataView(textBuffer("hello, world")),
				},
			],
		});

		const encoded = ndef.encodeNdefMessage(message);
		assert.deepEqual(
			encoded,
			new Uint8Array([
				209, 1, 15, 84, 2, 101, 110, 104, 101, 108, 108, 111, 44, 32, 119, 111,
				114, 108, 100,
			]).buffer,
		);
	});
});
