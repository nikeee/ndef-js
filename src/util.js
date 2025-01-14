// @ts-check

// This code is based on:
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
	let bytesAsHexString = "";
	for (let i = 0; i < bytes.length; i++) {
		const dec = bytes[i] >= 0 ? bytes[i] : 256 + bytes[i];
		bytesAsHexString += toHex(dec);
	}
	return bytesAsHexString;
}

/**
 * @param {number} i i must be <= 256
 * @returns {string}
 */
export function toHex(i) {
	const iEffective = i < 0 ? 256 + i : i;
	const hex = iEffective.toString(16);
	return hex.length === 1 ? `0${hex}` : hex;
}

/**
 * @param {number} i
 * @returns {string}
 */
export function toPrintable(i) {
	return i >= 0x20 && i <= 0x7f ? String.fromCharCode(i) : ".";
}
