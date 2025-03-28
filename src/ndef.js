// @ts-check

// This code is based on phonegap-nfc.js https://github.com/don/phonegap-nfc

import * as textHelper from "./text.js";
import * as uriHelper from "./uri.js";
import * as util from "./util.js";

/**
 * See [android.nfc.NdefRecord](https://developer.android.com/reference/android/nfc/NdefRecord) for documentation about constants.
 */
const TNF = /* @__PURE__ */ {
	EMPTY: 0x0,
	WELL_KNOWN: 0x01,
	MIME_MEDIA: 0x02,
	ABSOLUTE_URI: 0x03,
	EXTERNAL_TYPE: 0x04,
	UNKNOWN: 0x05,
	UNCHANGED: 0x06,
	RESERVED: 0x07,
};

const RTD = /* @__PURE__ */ {
	TEXT: "T", // [0x54]
	URI: "U", // [0x55]
	SMART_POSTER: "Sp", // [0x53, 0x70]
	ALTERNATIVE_CARRIER: "ac", //[0x61, 0x63]
	HANDOVER_CARRIER: "Hc", // [0x48, 0x63]
	HANDOVER_REQUEST: "Hr", // [0x48, 0x72]
	HANDOVER_SELECT: "Hs", // [0x48, 0x73]
};

/**
 * Convert NDEF records and messages to strings
 * This works OK for demos, but real code proably needs
 * a custom implementation. It would be nice to make
 * smarter record objects that can print themselves
 */
const stringifier = {
	/**
	 *
	 * @param {any[]} data
	 * @param {string} [separator] line separator, defaults to "\n".
	 * @returns {string}
	 */
	stringify: (data, separator) => {
		if (Array.isArray(data)) {
			if (typeof data[0] === "number") {
				// guessing this message bytes
				// biome-ignore lint/style/noParameterAssign: :shrug:
				data = ndef.decodeMessage(data);
			}

			return stringifier.printRecords(data, separator);
		}
		return stringifier.printRecord(data, separator);
	},

	/**
	 * @param {{ tnf: any; type: any; payload: number[]; }[]} message NDEF Message (array of NDEF Records)
	 * @param {string} [separator] line separator, defaults to "\n".
	 * @returns {string} string with NDEF Message
	 */
	printRecords: (/** @type {any} */ message, separator = "\n") => {
		let result = "";
		// Print out the payload for each record
		for (const record of message) {
			result += stringifier.printRecord(record, separator);
			result += separator;
		}

		return result.slice(0, -1 * separator.length);
	},

	/**
	 * @param {{ tnf: any; type: any; payload: number[]; }} record NDEF Record
	 * @param {string} [separator] line separator, defaults to "\n".
	 * @returns {string} string with NDEF Record
	 */
	printRecord: (record, separator = "\n") => {
		let result = "";

		switch (record.tnf) {
			case TNF.EMPTY:
				result += "Empty Record";
				result += separator;
				break;
			case TNF.WELL_KNOWN:
				result += stringifier.printWellKnown(record, separator);
				break;
			case TNF.MIME_MEDIA:
				result += "MIME Media";
				result += separator;
				result += s(record.type);
				result += separator;
				result += s(record.payload); // might be binary
				break;
			case TNF.ABSOLUTE_URI:
				result += "Absolute URI";
				result += separator;
				result += s(record.type); // the URI is the type
				result += separator;
				result += s(record.payload); // might be binary
				break;
			case TNF.EXTERNAL_TYPE:
				// AAR contains strings, other types could
				// contain binary data
				result += "External";
				result += separator;
				result += s(record.type);
				result += separator;
				result += s(record.payload);
				break;
			default:
				result += s(`Can't process TNF ${record.tnf}`);
		}

		result += separator;
		return result;
	},

	/**
	 * @param {{ tnf: any; type: any; payload: number[]; }} record
	 * @param {string} separator
	 * @returns {string}
	 */
	printWellKnown: (record, separator) => {
		let result = "";

		if (record.tnf !== TNF.WELL_KNOWN) {
			return "ERROR expecting TNF Well Known";
		}

		switch (record.type) {
			case RTD.TEXT:
				result += "Text Record";
				result += separator;
				result += ndef.text.decodePayload(record.payload);
				break;
			case RTD.URI:
				result += "URI Record";
				result += separator;
				result += ndef.uri.decodePayload(record.payload);
				break;
			case RTD.SMART_POSTER:
				result += "Smart Poster";
				result += separator;
				// the payload of a smartposter is a NDEF message
				result += stringifier.printRecords(ndef.decodeMessage(record.payload));
				break;
			default:
				// attempt to display other types
				result += `${record.type} Record`;
				result += separator;
				result += s(record.payload);
		}

		return result;
	},
};

const ndef = {
	TNF,
	RTD,

	// expose helper objects
	text: textHelper,
	uri: uriHelper,
	tnfToString,
	util,
	stringify: stringifier.stringify,

	/**
	 * Creates a JSON representation of a NDEF Record.
	 *
	 * @param {number} [tnf] 3-bit TNF (Type Name Format) - use one of the TNF.* constants
	 * @param {number[] | string} [type] byte array, containing zero to 255 bytes, must not be null
	 * @param {number[]} [id] byte array, containing zero to 255 bytes, must not be null
	 * @param {number[]} [payload] byte array, containing zero to (2 ** 32 - 1) bytes, must not be null
	 *
	 * @returns JSON representation of a NDEF record
	 *
	 * @see Ndef.textRecord, Ndef.uriRecord and Ndef.mimeMediaRecord for examples
	 */
	record: (tnf = TNF.EMPTY, type = [], id = [], payload = []) => {
		const record = {
			tnf,
			// store type as String so it's easier to compare
			type: Array.isArray(type) ? util.bytesToString(type) : type,
			// in the future, id could be a String
			id: Array.isArray(id) ? id : util.stringToBytes(id),
			payload: Array.isArray(payload) ? payload : util.stringToBytes(payload),
			value: undefined,
		};

		// Experimental feature
		// Convert payload to text for Text and URI records
		if (tnf === ndef.TNF.WELL_KNOWN) {
			switch (record.type) {
				case RTD.TEXT:
					record.value = ndef.text.decodePayload(record.payload);
					break;
				case RTD.URI:
					record.value = ndef.uri.decodePayload(record.payload);
					break;
			}
		}

		return record;
	},

	/**
	 * Helper that creates an NDEF record containing plain text.
	 *
	 * @param {string} text String of text to encode
	 * @param {string} [languageCode] ISO/IANA language code. Examples: "fi", "en-US", "fr-CA", "jp".
	 * @param {number[]} [id]
	 */
	textRecord: (text, languageCode, id = []) => {
		const payload = textHelper.encodePayload(text, languageCode);
		return ndef.record(ndef.TNF.WELL_KNOWN, RTD.TEXT, id, payload);
	},

	/**
	 * Helper that creates a NDEF record containing a URI.
	 *
	 * @param {string} uri
	 * @param {number[]} [id]
	 */
	uriRecord: (uri, id = []) => {
		const payload = uriHelper.encodePayload(uri);
		return ndef.record(ndef.TNF.WELL_KNOWN, RTD.URI, id, payload);
	},

	/**
	 * Helper that creates a NDEF record containing an absolute URI.
	 *
	 * An Absolute URI record means the URI describes the payload of the record.
	 *
	 * For example a SOAP message could use "http://schemas.xmlsoap.org/soap/envelope/"
	 * as the type and XML content for the payload.
	 *
	 * Absolute URI can also be used to write LaunchApp records for Windows.
	 *
	 * See 2.4.2 Payload Type of the NDEF Specification
	 * http://www.nfc-forum.org/specs/spec_list#ndefts
	 *
	 * Note that by default, Android will open the URI defined in the type
	 * field of an Absolute URI record (TNF=3) and ignore the payload.
	 * BlackBerry and Windows do not open the browser for TNF=3.
	 *
	 * To write a URI as the payload use ndef.uriRecord(uri)
	 *
	 * @param {string} uri
	 * @param {number[]} payload
	 * @param {number[]} [id]
	 */
	absoluteUriRecord: (uri, payload = [], id = []) => {
		return ndef.record(ndef.TNF.ABSOLUTE_URI, uri, id, payload);
	},

	/**
	 * Helper that creates a NDEF record containing an mimeMediaRecord.
	 *
	 * @param {string} mimeType
	 * @param {number[]} payload
	 * @param {number[]} [id]
	 */
	mimeMediaRecord: (mimeType, payload, id = []) => {
		return ndef.record(ndef.TNF.MIME_MEDIA, mimeType, id, payload);
	},

	/**
	 * Helper that creates an NDEF record containing an Smart Poster.
	 *
	 * @param {object[]} ndefRecords array of NDEF Records
	 * @param {number[]} [id]
	 */
	smartPoster: (ndefRecords, id = []) => {
		let payload = [];

		if (ndefRecords) {
			// make sure we have an array of something like NDEF records before encoding
			if (ndefRecords[0] instanceof Object && "tnf" in ndefRecords[0]) {
				payload = ndef.encodeMessage(ndefRecords);
			} else {
				// assume the caller has already encoded the NDEF records into a byte array
				payload = ndefRecords;
			}
		} else {
			console.log("WARNING: Expecting an array of NDEF records");
		}

		return ndef.record(ndef.TNF.WELL_KNOWN, RTD.SMART_POSTER, id, payload);
	},

	/**
	 * Helper that creates an empty NDEF record.
	 *
	 */
	emptyRecord: () => ndef.record(ndef.TNF.EMPTY, [], [], []),

	/**
	 * Helper that creates an Android Application Record (AAR).
	 * http://developer.android.com/guide/topics/connectivity/nfc/nfc.html#aar
	 *
	 * @param {string} packageName of the application
	 */
	androidApplicationRecord: (packageName) =>
		ndef.record(ndef.TNF.EXTERNAL_TYPE, "android.com:pkg", [], packageName),

	/**
	 * Encodes an NDEF Message into bytes that can be written to a NFC tag.
	 *
	 * @param {any[]} ndefRecords an Array of NDEF Records
	 * @returns {number[]} byte array
	 *
	 * @remarks NFC Data Exchange Format (NDEF) http://www.nfc-forum.org/specs/spec_list/
	 */
	encodeMessage: (ndefRecords) => {
		/** @type {any[]} */
		let encoded = [];
		let tnf_byte;
		let record_type;
		let payload_length;
		let id_length;
		let i;
		let mb;
		let me; // messageBegin, messageEnd
		const cf = false; // chunkFlag TODO implement
		let sr; // boolean shortRecord
		let il; // boolean idLengthFieldIsPresent

		for (i = 0; i < ndefRecords.length; i++) {
			mb = i === 0;
			me = i === ndefRecords.length - 1;
			sr = ndefRecords[i].payload.length < 0xff;
			il = ndefRecords[i].id.length > 0;
			tnf_byte = ndef.encodeTnf(mb, me, cf, sr, il, ndefRecords[i].tnf);
			encoded.push(tnf_byte);

			// type is stored as String, converting to bytes for storage
			record_type = util.stringToBytes(ndefRecords[i].type);
			encoded.push(record_type.length);

			if (sr) {
				payload_length = ndefRecords[i].payload.length;
				encoded.push(payload_length);
			} else {
				payload_length = ndefRecords[i].payload.length;
				// 4 bytes
				encoded.push(payload_length >> 24);
				encoded.push(payload_length >> 16);
				encoded.push(payload_length >> 8);
				encoded.push(payload_length & 0xff);
			}

			if (il) {
				id_length = ndefRecords[i].id.length;
				encoded.push(id_length);
			}

			encoded = encoded.concat(record_type);

			if (il) {
				encoded = encoded.concat(ndefRecords[i].id);
			}

			encoded = encoded.concat(ndefRecords[i].payload);
		}

		return encoded;
	},

	/**
	 * Decodes an array bytes into an NDEF Message
	 *
	 * @param {number[]} ndefBytes an array bytes or Buffer that was read from a NFC tag
	 * @returns {object[]} array of NDEF Records
	 *
	 * @remarks NFC Data Exchange Format (NDEF) http://www.nfc-forum.org/specs/spec_list/
	 */
	decodeMessage: (ndefBytes) => {
		// ndefBytes can be an array of bytes e.g. [0x03, 0x31, 0xd1] or a Buffer
		let bytes;
		if (ndefBytes instanceof Buffer) {
			// get an array of bytes
			bytes = Array.prototype.slice.call(ndefBytes, 0);
		} else if (Array.isArray(ndefBytes)) {
			bytes = ndefBytes.slice(0);
		} else {
			throw new Error(
				"ndef.decodeMessage requires a Buffer or an Array of bytes",
			);
		}

		bytes = bytes.slice(0); // clone since parsing is destructive
		const ndef_message = [];
		let tnf_byte;
		let header;
		let type_length = 0;
		let payload_length = 0;
		let id_length = 0;
		let record_type = [];
		let id = [];
		let payload = [];

		while (bytes.length) {
			tnf_byte = bytes.shift();
			header = ndef.decodeTnf(tnf_byte);

			type_length = bytes.shift();

			if (header.sr) {
				payload_length = bytes.shift();
			} else {
				// next 4 bytes are length
				payload_length =
					((0xff & bytes.shift()) << 24) |
					((0xff & bytes.shift()) << 16) |
					((0xff & bytes.shift()) << 8) |
					(0xff & bytes.shift());
			}

			id_length = header.il ? bytes.shift() : 0;

			record_type = bytes.splice(0, type_length);
			id = bytes.splice(0, id_length);
			payload = bytes.splice(0, payload_length);

			ndef_message.push(ndef.record(header.tnf, record_type, id, payload));

			if (header.me) break; // last message
		}

		return ndef_message;
	},

	/**
	 * Decode the bit flags from a TNF Byte.
	 *
	 * @param {number} tnf_byte
	 * @returns object with decoded data
	 * @remarks See NFC Data Exchange Format (NDEF) Specification Section 3.2 RecordLayout
	 */
	decodeTnf: (tnf_byte) => ({
		mb: (tnf_byte & 0x80) !== 0,
		me: (tnf_byte & 0x40) !== 0,
		cf: (tnf_byte & 0x20) !== 0,
		sr: (tnf_byte & 0x10) !== 0,
		il: (tnf_byte & 0x8) !== 0,
		tnf: tnf_byte & 0x7,
	}),

	/**
	 * Encode NDEF bit flags into a TNF Byte.
	 *
	 * @param {boolean} mb messageBegin
	 * @param {boolean} me messageEnd
	 * @param {boolean} cf chunkFlag
	 * @param {boolean} sr shortRecord
	 * @param {boolean} il idLengthFieldIsPresent
	 * @param {number} tnf type name format
	 * @returns {number} tnf byte
	 *
	 * @remarks See NFC Data Exchange Format (NDEF) Specification Section 3.2 RecordLayout
	 */
	encodeTnf: (mb, me, cf, sr, il, tnf) => {
		let value = tnf;

		if (mb) {
			value |= 0x80;
		}

		if (me) {
			value |= 0x40;
		}

		// note if cf: me, mb, li must be false and tnf must be 0x6
		if (cf) {
			value |= 0x20;
		}

		if (sr) {
			value |= 0x10;
		}

		if (il) {
			value |= 0x8;
		}

		return value;
	},

	// TODO test with byte[] and string
	isType: (record, tnf, type) => {
		if (record.tnf === tnf) {
			return s(record) === s(type);
		}
		return false;
	},
};

/**
 * @param {number} tnf
 * @returns {string}
 */
function tnfToString(tnf) {
	switch (tnf) {
		case ndef.TNF.EMPTY:
			return "Empty";
		case ndef.TNF.WELL_KNOWN:
			return "Well Known";
		case ndef.TNF.MIME_MEDIA:
			return "Mime Media";
		case ndef.TNF.ABSOLUTE_URI:
			return "Absolute URI";
		case ndef.TNF.EXTERNAL_TYPE:
			return "External";
		case ndef.TNF.UNKNOWN:
			return "Unknown";
		case ndef.TNF.UNCHANGED:
			return "Unchanged";
		case ndef.TNF.RESERVED:
			return "Reserved";
		default:
			return tnf?.toString();
	}
}

/**
 * @param {number[]} bytes
 * @returns {string}
 */
function s(bytes) {
	return Buffer.from(bytes).toString();
}

export default ndef;
