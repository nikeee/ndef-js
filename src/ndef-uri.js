// @ts-check

import * as util from "./ndef-util.js";

// URI identifier codes from URI Record Type Definition NFCForum-TS-RTD_URI_1.0 2006-07-24
// index in array matches code in the spec
const protocols = [
	"",
	"http://www.",
	"https://www.",
	"http://",
	"https://",
	"tel:",
	"mailto:",
	"ftp://anonymous:anonymous@",
	"ftp://ftp.",
	"ftps://",
	"sftp://",
	"smb://",
	"nfs://",
	"ftp://",
	"dav://",
	"news:",
	"telnet://",
	"imap:",
	"rtsp://",
	"urn:",
	"pop:",
	"sip:",
	"sips:",
	"tftp:",
	"btspp://",
	"btl2cap://",
	"btgoep://",
	"tcpobex://",
	"irdaobex://",
	"file://",
	"urn:epc:id:",
	"urn:epc:tag:",
	"urn:epc:pat:",
	"urn:epc:raw:",
	"urn:epc:",
	"urn:nfc:",
];

// decode a URI payload bytes
// @returns a string
export function decodePayload(data) {
	let prefix = protocols[data[0]];
	if (!prefix) {
		// 36 to 255 should be ""
		prefix = "";
	}
	return prefix + util.bytesToString(data.slice(1));
}

// shorten a URI with standard prefix
// @returns an array of bytes
export function encodePayload(uri) {
	let prefix;
	let protocolCode;
	let encoded;

	// check each protocol, unless we've found a match
	// "urn:" is the one exception where we need to keep checking
	// slice so we don't check ""
	protocols.slice(1).forEach((protocol) => {
		if ((!prefix || prefix === "urn:") && uri.indexOf(protocol) === 0) {
			prefix = protocol;
		}
	});

	if (!prefix) {
		prefix = "";
	}

	encoded = util.stringToBytes(uri.slice(prefix.length));
	protocolCode = protocols.indexOf(prefix);
	// prepend protocol code
	encoded.unshift(protocolCode);

	return encoded;
}
