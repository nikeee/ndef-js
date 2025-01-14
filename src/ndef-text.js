// @ts-check

import * as util from "./ndef-util.js";

// decode text bytes from ndef record payload
// @returns a string
export function decodePayload(data) {
	const languageCodeLength = data[0] & 0x3f; // 6 LSBs
	const languageCode = data.slice(1, 1 + languageCodeLength);
	const utf16 = (data[0] & 0x80) !== 0; // assuming UTF-16BE

	// TODO need to deal with UTF in the future
	// console.log("lang " + languageCode + (utf16 ? " utf16" : " utf8"));

	return util.bytesToString(data.slice(languageCodeLength + 1));
}

// encode text payload
// @returns an array of bytes
export function encodePayload(text, lang, encoding) {
	// ISO/IANA language code, but we're not enforcing
	if (!lang) {
		lang = "en";
	}

	const encoded = util.stringToBytes(lang + text);
	encoded.unshift(lang.length);

	return encoded;
}
