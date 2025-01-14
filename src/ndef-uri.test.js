// @ts-check

import * as assert from "node:assert";
import { describe, it } from "node:test";

import * as uriHelper from "./ndef-uri.js";
import * as util from "./util.js";

describe("NDEF URI Encoder", () => {
	it("should encode URIs", () => {
		const encoded = uriHelper.encodePayload("http://arduino.cc");
		assert.equal(3, encoded[0]); // prefix
		assert.equal(11, encoded.length);
	});

	it("should use first match", () => {
		// should substitute http://www. not http://
		let encoded = uriHelper.encodePayload("http://www.arduino.cc");
		assert.equal(1, encoded[0]); // prefix
		assert.equal(11, encoded.length);

		// should substitute https://www. not https://
		encoded = uriHelper.encodePayload("https://www.arduino.cc");
		assert.equal(2, encoded[0]); // prefix
		assert.equal(11, encoded.length);
	});

	it("should encode unknown prefixes", () => {
		const encoded = uriHelper.encodePayload("foo://bar");
		assert.equal(0, encoded[0]); // prefix
		assert.equal(10, encoded.length);
	});

	it("should encode bogus data", () => {
		const encoded = uriHelper.encodePayload("qwerty");
		assert.equal(0, encoded[0]); // prefix
		assert.equal(7, encoded.length);
	});

	it("should encode strange protocols", () => {
		const encoded = uriHelper.encodePayload("urn:epc:raw:somedata");
		assert.equal(33, encoded[0]); // prefix
		assert.equal(9, encoded.length);
	});
});

/**
 * @param {number} prefix
 * @param {string} string
 * @returns {number[]}
 */
function getBytes(prefix, string) {
	const bytes = util.stringToBytes(string);
	bytes.unshift(prefix);
	return bytes;
}

describe("NDEF URI Decoder", () => {
	it("should decode URIs", () => {
		let bytes = getBytes(0, "http://arduino.cc");
		let decoded = uriHelper.decodePayload(bytes);
		assert.equal("http://arduino.cc", decoded);

		bytes = getBytes(1, "arduino.cc");
		decoded = uriHelper.decodePayload(bytes);
		assert.equal("http://www.arduino.cc", decoded);

		bytes = getBytes(2, "arduino.cc");
		decoded = uriHelper.decodePayload(bytes);
		assert.equal("https://www.arduino.cc", decoded);

		bytes = getBytes(3, "arduino.cc");
		decoded = uriHelper.decodePayload(bytes);
		assert.equal("http://arduino.cc", decoded);

		bytes = getBytes(4, "arduino.cc");
		decoded = uriHelper.decodePayload(bytes);
		assert.equal("https://arduino.cc", decoded);
	});

	it("should handle invalid prefixes", () => {
		let bytes = getBytes(36, "foo");
		let decoded = uriHelper.decodePayload(bytes);
		assert.equal("foo", decoded);

		bytes = getBytes(0xff, "foo");
		decoded = uriHelper.decodePayload(bytes);
		assert.equal("foo", decoded);

		bytes = getBytes(-1, "foo");
		decoded = uriHelper.decodePayload(bytes);
		assert.equal("foo", decoded);

		bytes = getBytes(-255, "foo");
		decoded = uriHelper.decodePayload(bytes);
		assert.equal("foo", decoded);
	});
});
