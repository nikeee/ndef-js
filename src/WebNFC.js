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
 * @typedef {string | BufferSource | NDEFMessageInit} NDEFRecordDataSource
 *
 * @typedef {{
 *   recordType: string
 *   mediaType?: string
 *   id?: string
 *   encoding?: string
 *   lang?: string
 *   data?: NDEFRecordDataSource
 * }} NDEFRecordInit // TODO
 */

/**
 * @param {NDEFMessageInit | string | BufferSource} message
 * @returns {NDEFMessage}
 */
export function createNdefMessage(message) {
	const res = createNdefMessageInner(message, "", 0);
	if (!checkCreatedRecords(res.records, "")) {
		throw new TypeError("The created record is invalid");
	}
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
 * Implements https://w3c.github.io/web-nfc/#check-created-records
 * @param {readonly NDEFRecord[]} records
 * @param {string} context
 * @returns {boolean}
 */
function checkCreatedRecords(records, context) {
	return true; // TODO
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
 * See [android.nfc.NdefRecord](https://developer.android.com/reference/android/nfc/NdefRecord) for documentation about constants.
 *
 * @typedef {keyof TNF} TNFType
 */
const TNF = /* @__PURE__ */ Object.freeze({
	EMPTY: 0,
	WELL_KNOWN: 1,
	MIME_MEDIA: 2,
	ABSOLUTE_URI: 3,
	EXTERNAL_TYPE: 4,
	UNKNOWN: 5,
	UNCHANGED: 6,
	RESERVED: 7,
});

/**
 * @param {NDEFMessage} message
 * @returns {Uint8Array}
 */
export function encodeNdefMessage(message) {
	const recordCount = message.records.length;
	const _encodedRecords = message.records.map((r, i) =>
		encodeNdefRecord(r, i, recordCount),
	);

	throw new Error("Not implemented");
}

/**
 * @param {NDEFRecord} record
 * @param {number} recordIndex
 * @param {number} recordCount
 */
function encodeNdefRecord(record, recordIndex, recordCount) {
	// https://w3c.github.io/web-nfc/#the-ndef-record-and-fields

	const id =
		"id" in record && record.id !== undefined && record.id !== null
			? record.id
			: undefined;

	const header = {
		mb: recordIndex === 0,
		me: recordIndex === recordCount - 1,
		cf: false,
		sr: false,
		il: id !== undefined,
		tnf: 0,
	};

	switch (record.recordType) {
		case "empty": {
			header.tnf = TNF.EMPTY;
			break;
		}

		default:
			throw new Error("Unsupported recordType");
	}

	const headerByte =
		(header.mb ? 0b10000_000 : 0) |
		(header.me ? 0b01000_000 : 0) |
		(header.cf ? 0b00100_000 : 0) |
		(header.sr ? 0b00010_000 : 0) |
		(header.il ? 0b00001_000 : 0) |
		header.tnf;

	const typeLength = 0; // TODO
	const payloadLength = 0; // TODO
	const idLength = 0; // TODO

	const buffer = [headerByte, typeLength, payloadLength];

	if (id !== undefined) {
		buffer.push(idLength);
	}

	if (typeLength > 0) {
		throw new Error("Not implemented");
	}

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
