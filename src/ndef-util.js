// @ts-check

// ndef-util.js
// Copyright 2013 Don Coleman
//

// This is from phonegap-nfc.js and is a combination of helpers in nfc and util
// https://github.com/chariotsolutions/phonegap-nfc/blob/master/www/phonegap-nfc.js

/**
 * @param {string} string
 * @returns {number[]}
 */
export function stringToBytes(string) {
	return Buffer.from(string).toJSON().data;
}

/**
 * @param {number[]} bytes
 * @returns {string}
 */
export function bytesToString(bytes) {
	return Buffer.from(bytes).toString();
}

/**
 * useful for readable version of Tag UID
 * @param {number[]} bytes
 * @returns
 */
export function bytesToHexString(bytes) {
	let dec;
	let hexString;
	let bytesAsHexString = "";
	for (let i = 0; i < bytes.length; i++) {
		if (bytes[i] >= 0) {
			dec = bytes[i];
		} else {
			dec = 256 + bytes[i];
		}
		hexString = dec.toString(16);
		// zero padding
		if (hexString.length === 1) {
			hexString = `0${hexString}`;
		}
		bytesAsHexString += hexString;
	}
	return bytesAsHexString;
}

/**
 * @param {number} i i must be <= 256
 * @returns {string}
 */
export function toHex(i) {
	let hex;

	if (i < 0) {
		i += 256;
	}
	hex = i.toString(16);

	// zero padding
	if (hex.length === 1) {
		hex = `0${hex}`;
	}
	return hex;
}

/**
 * @param {number} i
 * @returns {string}
 */
export function toPrintable(i) {
	if (i >= 0x20 && i <= 0x7f) {
		return String.fromCharCode(i);
	}
	return ".";
}
