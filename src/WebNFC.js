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
 * @param {NDEFMessageInit} message
 * @returns {NDEFMessage}
 */
export function createNdefMessage(message) {
	return {
		records: message.records.map(createNdefRecord),
	};
}

/**
 * @param {NDEFRecordInit} record
 * @returns {NDEFRecord}
 */
export function createNdefRecord(record) {
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
