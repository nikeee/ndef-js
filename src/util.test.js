// @ts-check

import * as assert from "node:assert";
import { describe, it } from "node:test";

import * as util from "./util.js";

describe("UTF-8", () => {
	it("should encode UTF-8", () => {
		const bytes = [0x54, 0x65, 0x73, 0x74, 0x73, 0xd7, 0x90, 0xc2, 0xa2];

		const encoded = util.stringToBytes("Testsא¢");
		assert.deepEqual(encoded, bytes);
	});

	it("should decode UTF-8", () => {
		const bytes = [0x54, 0x65, 0x73, 0x74, 0x73, 0xd7, 0x90, 0xc2, 0xa2];

		const decoded = util.bytesToString(bytes);
		assert.equal(decoded, "Testsא¢");
	});

	it("should encode and decode Russian", () => {
		// http://www.columbia.edu/~kermit/utf8.html
		const russian = "На берегу пустынных волн";
		const russianBytes = [
			0xd0, 0x9d, 0xd0, 0xb0, 0x20, 0xd0, 0xb1, 0xd0, 0xb5, 0xd1, 0x80, 0xd0,
			0xb5, 0xd0, 0xb3, 0xd1, 0x83, 0x20, 0xd0, 0xbf, 0xd1, 0x83, 0xd1, 0x81,
			0xd1, 0x82, 0xd1, 0x8b, 0xd0, 0xbd, 0xd0, 0xbd, 0xd1, 0x8b, 0xd1, 0x85,
			0x20, 0xd0, 0xb2, 0xd0, 0xbe, 0xd0, 0xbb, 0xd0, 0xbd,
		];

		const encoded = util.stringToBytes(russian);
		assert.deepEqual(encoded, russianBytes);

		const decoded = util.bytesToString(russianBytes);
		assert.equal(decoded, russian);
	});

	it("should round trip encode and decode UTF-8", () => {
		// http://www.columbia.edu/~kermit/utf8.html
		const chinese = "我能吞下玻璃而不伤身体。";
		assert.equal(util.bytesToString(util.stringToBytes(chinese)), chinese);

		const korean = "나는 유리를 먹을 수 있어요. 그래도 아프지 않아요";
		assert.equal(util.bytesToString(util.stringToBytes(korean)), korean);

		const url = "http://example.com/with-utf8-✓";
		assert.equal(util.bytesToString(util.stringToBytes(url)), url);
	});
});
