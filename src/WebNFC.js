// @ts-check

// Loosely based on the WebNFC standard:
// https://github.com/w3c/web-nfc/blob/gh-pages/web-nfc.d.ts
// https://w3c.github.io/web-nfc/#parsing-ndef-records

/** @typedef {NDEFRecord["recordType"]} NDEFRecordType */

/**
 * @typedef {{
 *   id: string | null;
 *   lang: null | string;
 * }} NDEFRecordBase
 *
 * @typedef {{
 *   recordType: "empty";
 *   id: null;
 *   lang: null;
 *   encoding: null;
 *   mediaType: null;
 *   data: null;
 * }} EmptyNDEFRecord
 *
 * @typedef {{
 *   recordType: "text";
 *   mediaType: null;
 *   data: null | DataView;
 *   lang: string;
 * }} TextNDEFRecord
 *
 * @typedef {{
 *   recordType: "url";
 *   mediaType: null;
 *   data: null | DataView;
 *   lang: null;
 *   encoding: null;
 * }} UrlNDEFRecord
 *
 * @typedef {{
 *   recordType: "smart-poster";
 *   mediaType: null;
 *   data: null | DataView;
 * }} SmartPosterNDEFRecord
 *
 * @typedef {{
 *   recordType: "mime";
 *   mediaType: string;
 * }} MimeNDEFRecord
 *
 * @typedef {{
 *   recordType: "unknown";
 *   mediaType: null;
 * }} UnknownNDEFRecord
 *
 * @typedef {EmptyNDEFRecord | TextNDEFRecord | UrlNDEFRecord | SmartPosterNDEFRecord | MimeNDEFRecord | UnknownNDEFRecord} NDEFRecord
 *
 * @typedef {{
 *   records: readonly NDEFRecord[];
 * }} NDEFMessage
 *
 * @typedef {{
 *   records: NDEFRecordInit[];
 * }} NDEFMessageInit
 *
 * @typedef {unknown} NDEFRecordInit // TODO
 */

/**
 * @param {NDEFMessageInit | string | BufferSource} message
 * @returns {NDEFMessage}
 */
export function createNdefMessage(message) {
	const res = createNdefMessageInner(message, "", 0);
	// TODO: Check created records
	return res;
}

/**
 * @param {NDEFMessageInit | string | BufferSource} source
 * @param {string} context
 * @param {number} recordsDepth
 * @returns {NDEFMessage}
 */
function createNdefMessageInner(source, context, recordsDepth) {
	// See: https://w3c.github.io/web-nfc/#creating-ndef-message

	if (typeof source === "string") {
		return {
			records: [
				createNdefRecord({
					recordType: "text",
					lang: "en",
					data: new TextEncoder().encode(source).buffer,
				}),
			],
		};
	}

	if (isBufferSource(source)) {
		return {
			records: [
				createNdefRecord({
					recordType: "mime",
					mediaType: "application/octet-stream",
					data: source,
				}),
			],
		};
	}

	if ("records" in source && Array.isArray(source.records)) {
		if (source.records.length === 0) {
			throw new TypeError("The given message is empty");
		}

		const newRecordsDepth = recordsDepth + 1;
		if (newRecordsDepth > 32) {
			throw new TypeError("The given message is too deeply nested");
		}

		return {
			records: source.records.map((r) =>
				createNdefRecordInner(r, context, newRecordsDepth),
			),
		};
	}

	throw new TypeError("Unable to process the given message");
}

/**
 * @param {NDEFRecordInit} record
 * @returns {NDEFRecord}
 */
export function createNdefRecord(record) {
	return createNdefRecordInner(record, "", 0);
}

/**
 * @param {NDEFRecordInit} record
 * @param {string} context
 * @param {number} recordsDepth
 * @returns {NDEFRecord}
 */
function createNdefRecordInner(record, context, recordsDepth) {
	throw new Error("Not implemented");
}

/**
 * @param {NDEFMessage} message
 * @returns {Uint8Array}
 */
export function encodeNdefMessage(message) {
	throw new Error("Not implemented");
}

/**
 * @param {BufferSource} message
 * @returns {NDEFMessage}
 */
export function decodeNdefMessage(message) {
	throw new Error("Not implemented");
}

/**
 * @param {unknown} value
 * @returns {value is BufferSource}
 */
function isBufferSource(value) {
	return value instanceof ArrayBuffer || ArrayBuffer.isView(value);
}
