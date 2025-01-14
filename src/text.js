// @ts-check

import * as util from "./util.js";

/**
 * decode text bytes from ndef record payload
 *
 * @param {number[]} data
 * @returns {string}
 */
export function decodePayload(data) {
	const languageCodeLength = data[0] & 0x3f; // 6 LSBs
	const languageCode = data.slice(1, 1 + languageCodeLength);
	const utf16 = (data[0] & 0x80) !== 0; // assuming UTF-16BE

	// TODO need to deal with UTF in the future
	// console.log("lang " + languageCode + (utf16 ? " utf16" : " utf8"));

	return util.bytesToString(data.slice(languageCodeLength + 1));
}

/**
 * encode text payload
 *
 * @param {string} text
 * @param {string} language ISO/IANA language code. But it's not enforced.
 * @returns {number[]}
 */
export function encodePayload(text, language = "en") {
	const encoded = util.stringToBytes(language + text);
	encoded.unshift(language.length);
	return encoded;
}
