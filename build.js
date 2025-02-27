const fs = require('fs');
const path = require('path');
const {
	Transform,
	Readable
} = require('stream');
const {
	pipeline
} = require('stream/promises');
const UglifyJS = require('uglify-js');
const simpleGit = require('simple-git');
const {
	execSync
} = require('child_process');
async function main() {
	const {
		default: fetch
	} = await import('node-fetch');
	console.log('Fetching resources...');
	if (!fs.existsSync('brotlijs')) {
		await simpleGit().clone('https://github.com/dominikhlbg/brotlijs.git', 'brotlijs');
	} else {
		console.log('brotlijs repository already exists.');
	}
	const bFile = 'b';
	if (!fs.existsSync(bFile)) {
		const bookUrl = 'https://github.com/PascalPons/connect4/releases/download/book/7x6.book';
		const res = await fetch(bookUrl);
		if (!res.ok) throw new Error(`Failed to download book: ${res.statusText}`);
		const dest = fs.createWriteStream(bFile);
		await new Promise((resolve, reject) => {
			res.body.pipe(dest);
			res.body.on('error', reject);
			dest.on('finish', resolve);
		});
	} else {
		console.log('Connect 4 book already fetched.');
	}
	console.log('Compressing book...');
	if (!fs.existsSync(bFile)) throw new Error(`File "${bFile}" not found.`);
	execSync(`brotli ${bFile}`, {
		stdio: 'inherit'
	});
	const compressedFilePath = `${bFile}.br`;
	if (!fs.existsSync(compressedFilePath)) throw new Error(`Compressed file "${compressedFilePath}" not found.`);
	const compressedBuffer = fs.readFileSync(compressedFilePath);
	console.log('Encoding compressed book...');
	const customSet = "\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\x0B\x0C\x0E\x0F\x10\x11\x12\x13\x14\x15\x16\x17\x18\x19\x1A\x1B\x1C\x1D\x1E\x1F !\"#$%&()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopqrstuvwxyz{|}~\x7F\x80\x81\x82\x83";

	function base128Encode(buffer) {
		let result = "",
			bits = 0,
			bitCount = 0;
		for (let byte of buffer) {
			bits = (bits << 8) | byte;
			bitCount += 8;
			while (bitCount >= 7) {
				bitCount -= 7;
				result += customSet.charAt((bits >> bitCount) & 0x7F);
			}
		}
		if (bitCount > 0) result += customSet.charAt((bits << (7 - bitCount)) & 0x7F);
		return result;
	}
	const encodedB = base128Encode(compressedBuffer);
	console.log('Generating c4i...');
	const brotliPath = path.join('brotlijs', 'brotli.js');
	let brotliContent = fs.readFileSync(brotliPath, 'utf8');
	let brotliLines = brotliContent.split(/\r?\n/);
	const removeRanges = [
		[8308, 8242],
		[7691, 2185],
		[269, 235],
		[167, 146],
		[130, 57],
		[52, 35],
		[33, 31],
		[29]
	];
	let linesToRemove = [];
	for (const range of removeRanges) {
		if (range.length === 1) linesToRemove.push(range[0]);
		else if (range.length === 2) {
			const [start, end] = range;
			for (let i = start; i >= end; i--) linesToRemove.push(i);
		}
	}
	linesToRemove.sort((a, b) => b - a);
	for (const lineNum of linesToRemove) {
		const index = lineNum - 1;
		if (index >= 0 && index < brotliLines.length) brotliLines.splice(index, 1);
	}
	brotliContent = brotliLines.join('\n');
	const dictPath = path.join('brotlijs', 'dictionary.txt');
	const dictBuffer = fs.readFileSync(dictPath);
	const encodedDictionary = base128Encode(dictBuffer);
	brotliContent = brotliContent.replace(/this\.OpenInputAjax\(dictionary_path/g, "base128Decode('" + encodedDictionary + "'");
	fs.writeFileSync(brotliPath, brotliContent, 'utf8');
	class ReplaceStream extends Transform {
		constructor(searchStr, replaceStr, options) {
			super(options);
			this.searchStr = searchStr;
			this.replaceStr = replaceStr;
			this.tail = '';
		}
		_transform(chunk, encoding, callback) {
			let data = this.tail + chunk.toString('utf8');
			const tailLength = this.searchStr.length - 1;
			let processUpTo = data.length > tailLength ? data.length - tailLength : 0;
			this.tail = data.slice(processUpTo);
			let processData = data.slice(0, processUpTo);
			processData = processData.split(this.searchStr).join(this.replaceStr);
			this.push(processData);
			callback();
		}
		_flush(callback) {
			let data = this.tail.split(this.searchStr).join(this.replaceStr);
			this.push(data);
			callback();
		}
	}
	async function* combinedChunks() {
		const files = ['b128.js', path.join('brotlijs', 'brotli.js'), 'c4.js'];
		for (const file of files) {
			const stream = fs.createReadStream(file);
			for await (const chunk of stream) yield chunk;
			yield Buffer.from("\n");
		}
	}
	const combinedStream = Readable.from(combinedChunks());
	const placeholder = "!@";
	const replaceStream = new ReplaceStream(placeholder, encodedB);
	const unminPath = 'unmin.js';
	const writeStream = fs.createWriteStream(unminPath);
	await pipeline(combinedStream, replaceStream, writeStream);
	const originalCode = fs.readFileSync(unminPath, 'utf8');
	const minified = UglifyJS.minify(originalCode, {
		compress: {
			passes: 2
		}
	});
	if (minified.error) throw minified.error;
	let finalCode = minified.code;
	finalCode = finalCode.replace(/\\(0|b|t|v|f)/g, (match, p1) => {
		switch (p1) {
			case '0':
				return "\x00";
			case 'b':
				return "\x08";
			case 't':
				return "\x09";
			case 'v':
				return "\x0B";
			case 'f':
				return "\x0C";
			default:
				return match;
		}
	});
	const outputPath = 'c4i.js';
	fs.writeFileSync(outputPath, finalCode, 'utf8');
	fs.rmSync(path.join(__dirname, 'brotlijs'), {
		recursive: true,
		force: true
	});
	fs.rmSync(path.join(__dirname, 'node_modules'), {
		recursive: true,
		force: true
	});
	fs.rmSync(path.join(__dirname, 'b'), {
		force: true
	});
	fs.rmSync(path.join(__dirname, 'b.br'), {
		force: true
	});
	fs.rmSync(path.join(__dirname, 'unmin.js'), {
		force: true
	});
	fs.rmSync(path.join(__dirname, 'package-lock.json'), {
		force: true
	});
	fs.rmSync(path.join(__dirname, 'package.json'), {
		force: true
	});
}
main().catch(err => {
	try {
		fs.rmSync(path.join(__dirname, 'brotlijs'), {
			recursive: true,
			force: true
		});
	} catch (_) {}
	try {
		fs.rmSync(path.join(__dirname, 'node_modules'), {
			recursive: true,
			force: true
		});
	} catch (_) {}
	try {
		fs.rmSync(path.join(__dirname, 'b'), {
			force: true
		});
	} catch (_) {}
	try {
		fs.rmSync(path.join(__dirname, 'b.br'), {
			force: true
		});
	} catch (_) {}
	try {
		fs.rmSync(path.join(__dirname, 'unmin.js'), {
			force: true
		});
	} catch (_) {}
	try {
		fs.rmSync(path.join(__dirname, 'package-lock.json'), {
			force: true
		});
	} catch (_) {}
	try {
		fs.rmSync(path.join(__dirname, 'package.json'), {
			force: true
		});
	} catch (_) {}
	console.error("Build failed.", err);
	process.exit(1);
});
