// @ts-check

// Loosely based on the WebNFC standard:
// https://github.com/w3c/web-nfc/blob/gh-pages/web-nfc.d.ts
// https://w3c.github.io/web-nfc/#parsing-ndef-records

/** @typedef {NDEFRecord["recordType"]} NDEFRecordType */

/**
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
 *   id: string | null;
 *   lang: string;
 *   encoding: "utf-8";
 *   mediaType: null;
 *   data: null | DataView;
 * }} TextNDEFRecord
 *
 * @typedef {{
 *   recordType: "url";
 *   id: string | null;
 *   lang: null;
 *   encoding: null;
 *   mediaType: null;
 *   data: null | DataView;
 * }} UrlNDEFRecord
 *
 * @typedef {{
 *   recordType: "smart-poster";
 *   id: string | null;
 *   lang: null;
 *   encoding: null;
 *   mediaType: null;
 *   data: null | DataView;
 * }} SmartPosterNDEFRecord
 *
 * @typedef {{
 *   recordType: "mime";
 *   id: string | null;
 *   lang: null;
 *   encoding: null;
 *   mediaType: string;
 *   data: DataView;
 * }} MimeNDEFRecord
 *
 * @typedef {{
 *   recordType: "unknown";
 *   id: string | null;
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

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

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
	switch (record.recordType) {
		case "empty": {
			if (record.lang !== null && record.lang !== undefined) {
				throw new TypeError("The lang attribute must be null for empty record");
			}
			if (record.mediaType !== null && record.mediaType !== undefined) {
				throw new TypeError(
					"The mediaType attribute must be null for empty record",
				);
			}

			return {
				recordType: "empty",
				id: null,
				lang: null,
				encoding: null,
				mediaType: null,
				data: null,
			};
		}
		case "text": {
			if (record.mediaType !== null && record.mediaType !== undefined) {
				throw new TypeError(
					"The mediaType attribute must be null for text record",
				);
			}

			const data = record.data;
			if (!data || (typeof data !== "string" && !isBufferSource(data))) {
				throw new TypeError(
					"The data attribute must be a string or BufferSource for text record",
				);
			}

			let encoding;
			if (typeof data === "string") {
				if (
					(record.encoding !== null && record.encoding !== undefined) ||
					record.encoding !== "utf-8"
				) {
					throw new TypeError(
						"The encoding attribute must be null or 'utf-8' for text record",
					);
				}

				encoding = "utf-8";
			} else {
				encoding = record.encoding ?? "utf-8";
				if (
					encoding !== "utf-8" &&
					encoding !== "utf-16" &&
					encoding !== "utf-16be" &&
					encoding !== "utf-16le"
				) {
					throw new TypeError("Unsupported encoding");
				}
			}

			if (encoding !== "utf-8") {
				// Maybe we should support other encodings
				// The checks above are there to adhere the standard,
				// while we ultimately do not support other encodings
				throw new TypeError("Encoding not supported by this library");
			}

			const lang = record.lang ?? "en";
			if (lang.length > 63) {
				throw new TypeError("The lang attribute must be at most 63 characters");
			}

			return {
				recordType: "text",
				id: record.id ?? null,
				lang,
				encoding,
				mediaType: null,
				data: new DataView(
					typeof data === "string" ? textEncoder.encode(data) : data,
				),
			};
		}

		case "mime": {
			const data = record.data;
			if (!data || !isBufferSource(data)) {
				throw new TypeError(
					"The data attribute must be a BufferSource for mime record",
				);
			}

			if (record.mediaType === undefined || record.mediaType === null) {
				throw new TypeError(
					"The mediaType attribute is required for mime record",
				);
			}

			// TODO: parse media type:
			// https://mimesniff.spec.whatwg.org/#parse-a-mime-type

			return {
				recordType: "mime",
				id: record.id ?? null,
				lang: null,
				encoding: null,
				mediaType: record.mediaType,
				data: new DataView(data),
			};
		}

		default:
			throw new TypeError("Unsupported recordType");
	}
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

	let type = null;

	switch (record.recordType) {
		case "empty": {
			header.tnf = TNF.EMPTY;
			type = new Uint8Array(0);
			break;
		}
		case "text": {
			header.tnf = TNF.WELL_KNOWN;
			type = new Uint8Array([0x54]); // "T"
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

	/*
		const header = (encoding !== "utf-8" ? 0b1_0_000000 : 0) |
		(lang.length & 0b0_0_111111);
		const payload = [
			header,
			...textEncoder.encode(lang),
			...(typeof data === "string" ? textEncoder.encode(data) : data),
		];
		*/

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
