const ndef = require("./ndef");
module.exports = ndef;

if (process.version.indexOf("v0.8") === 0) {
	// Monkey Patch Buffer for Node 0.8 support
	Buffer.prototype.toJSON = function () {
		j = [];
		for (let i = 0; i < this.length; i++) {
			j[i] = this[i];
		}
		return j;
	};
}
