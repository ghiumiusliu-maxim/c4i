class Position {
	static WIDTH = 7;
	static HEIGHT = 6;
	static MIN_SCORE = -Math.floor(7 * 6 / 2) + 3;
	static MAX_SCORE = Math.floor((7 * 6 + 1) / 2) - 3;
	constructor() {
		this.current_position = 0n;
		this.mask = 0n;
		this.moves = 0;
	}
	play(move) {
		this.current_position = this.current_position ^ this.mask;
		this.mask = this.mask | move;
		this.moves++;
	}
	playSequence(seq) {
		for (let i = 0; i < seq.length; i++) {
			let col = seq.charCodeAt(i) - '1'.charCodeAt(0);
			if (col < 0 || col >= Position.WIDTH || !this.canPlay(col) || this.isWinningMove(col))
				return i;
			this.playCol(col);
		}
		return seq.length;
	}
	canWinNext() {
		return (this.winning_position() & this.possible()) != 0n;
	}
	nbMoves() {
		return this.moves;
	}
	key() {
		return this.current_position + this.mask;
	}
	key3() {
		let key_forward = 0n;
		for (let i = 0; i < Position.WIDTH; i++) {
			key_forward = this.partialKey3(key_forward, i);
		}
		let key_reverse = 0n;
		for (let i = Position.WIDTH - 1; i >= 0; i--) {
			key_reverse = this.partialKey3(key_reverse, i);
		}
		return (key_forward < key_reverse ? key_forward : key_reverse) / 3n;
	}
	partialKey3(key, col) {
		let pos = 1n << BigInt(col * (Position.HEIGHT + 1));
		while ((pos & this.mask) != 0n) {
			key = key * 3n;
			key = key + ((pos & this.current_position) != 0n ? 1n : 2n);
			pos = pos << 1n;
		}
		return key * 3n;
	}
	possibleNonLosingMoves() {
		let possible_mask = this.possible();
		let opponent_win = this.opponent_winning_position();
		let forced_moves = possible_mask & opponent_win;
		if (forced_moves != 0n) {
			if (forced_moves & (forced_moves - 1n))
				return 0n;
			else possible_mask = forced_moves;
		}
		return possible_mask & ~(opponent_win >> 1n);
	}
	moveScore(move) {
		return Position.popcount(Position.compute_winning_position(this.current_position | move, this.mask));
	}
	canPlay(col) {
		return (this.mask & Position.top_mask_col(col)) == 0n;
	}
	playCol(col) {
		this.play((this.mask + Position.bottom_mask_col(col)) & Position.column_mask(col));
	}
	isWinningMove(col) {
		return (this.winning_position() & this.possible() & Position.column_mask(col)) != 0n;
	}
	winning_position() {
		return Position.compute_winning_position(this.current_position, this.mask);
	}
	opponent_winning_position() {
		return Position.compute_winning_position(this.current_position ^ this.mask, this.mask);
	}
	possible() {
		return (this.mask + Position.bottom_mask) & Position.board_mask;
	}
	static popcount(m) {
		let c = 0;
		while (m) {
			m = m & (m - 1n);
			c++;
		}
		return c;
	}
	static compute_winning_position(position, mask) {
		let r = (position << 1n) & (position << 2n) & (position << 3n);
		let p = (position << BigInt(Position.HEIGHT + 1)) & (position << BigInt(2 * (Position.HEIGHT + 1)));
		r |= p & (position << BigInt(3 * (Position.HEIGHT + 1)));
		r |= p & (position >> BigInt(Position.HEIGHT + 1));
		p = (position >> BigInt(Position.HEIGHT + 1)) & (position >> BigInt(2 * (Position.HEIGHT + 1)));
		r |= p & (position << BigInt(Position.HEIGHT + 1));
		r |= p & (position >> BigInt(3 * (Position.HEIGHT + 1)));
		p = (position << BigInt(Position.HEIGHT)) & (position << BigInt(2 * Position.HEIGHT));
		r |= p & (position << BigInt(3 * Position.HEIGHT));
		r |= p & (position >> BigInt(Position.HEIGHT));
		p = (position >> BigInt(Position.HEIGHT)) & (position >> BigInt(2 * Position.HEIGHT));
		r |= p & (position << BigInt(Position.HEIGHT));
		r |= p & (position >> BigInt(3 * Position.HEIGHT));
		p = (position << BigInt(Position.HEIGHT + 2)) & (position << BigInt(2 * (Position.HEIGHT + 2)));
		r |= p & (position << BigInt(3 * (Position.HEIGHT + 2)));
		r |= p & (position >> BigInt(Position.HEIGHT + 2));
		p = (position >> BigInt(Position.HEIGHT + 2)) & (position >> BigInt(2 * (Position.HEIGHT + 2)));
		r |= p & (position << BigInt(Position.HEIGHT + 2));
		r |= p & (position >> BigInt(3 * (Position.HEIGHT + 2)));
		return r & (Position.board_mask ^ mask);
	}
	static get bottom_mask() {
		let mask = 0n;
		for (let col = 0; col < Position.WIDTH; col++) {
			mask |= 1n << BigInt(col * (Position.HEIGHT + 1));
		}
		return mask;
	}
	static get board_mask() {
		return Position.bottom_mask * ((1n << BigInt(Position.HEIGHT)) - 1n);
	}
	static top_mask_col(col) {
		return 1n << BigInt((Position.HEIGHT - 1) + col * (Position.HEIGHT + 1));
	}
	static bottom_mask_col(col) {
		return 1n << BigInt(col * (Position.HEIGHT + 1));
	}
	static column_mask(col) {
		return (((1n << BigInt(Position.HEIGHT)) - 1n) << BigInt(col * (Position.HEIGHT + 1)));
	}
}
class MoveSorter {
	constructor() {
		this.size = 0;
		this.entries = new Array(Position.WIDTH);
		for (let i = 0; i < Position.WIDTH; i++) {
			this.entries[i] = {
				move: 0n,
				score: 0
			};
		}
	}
	add(move, score) {
		let pos = this.size;
		this.size++;
		while (pos > 0 && this.entries[pos - 1].score > score) {
			this.entries[pos] = this.entries[pos - 1];
			pos--;
		}
		this.entries[pos] = {
			move: move,
			score: score
		};
	}
	getNext() {
		if (this.size) {
			this.size--;
			return this.entries[this.size].move;
		} else return 0n;
	}
	reset() {
		this.size = 0;
	}
}
class OpeningBook {
	constructor(width, height) {
		this.width = width;
		this.height = height;
		this.depth = -1;
		this.T = null;
	}
	load(fileBuffer) {
		this.depth = -1;
		this.T = null;
		let view = new DataView(fileBuffer);
		let offset = 0;
		let _width = view.getUint8(offset);
		offset++;
		if (_width != this.width) {
			console.error("Unable to load opening book: invalid width (found: " + _width + ", expected: " + this
				.width + ")");
			return;
		}
		let _height = view.getUint8(offset);
		offset++;
		if (_height != this.height) {
			console.error("Unable to load opening book: invalid height(found: " + _height + ", expected: " + this
				.height + ")");
			return;
		}
		let _depth = view.getInt8(offset);
		offset++;
		if (_depth > this.width * this.height) {
			console.error("Unable to load opening book: invalid depth (found: " + _depth + ")");
			return;
		}
		let partial_key_bytes = view.getUint8(offset);
		offset++;
		if (partial_key_bytes > 8) {
			console.error("Unable to load opening book: invalid internal key size(found: " + partial_key_bytes +
				")");
			return;
		}
		let value_bytes = view.getUint8(offset);
		offset++;
		if (value_bytes != 1) {
			console.error("Unable to load opening book: invalid value size (found: " + value_bytes +
				", expected: 1)");
			return;
		}
		let log_size = view.getUint8(offset);
		offset++;
		if (log_size > 40) {
			console.error("Unable to load opening book: invalid log2(size)(found: " + log_size + ")");
			return;
		}
		let tableSize = OpeningBook.nextPrime(1 << log_size);
		let keys = new Uint8Array(fileBuffer, offset, tableSize * partial_key_bytes);
		offset += tableSize * partial_key_bytes;
		let values = new Uint8Array(fileBuffer, offset, tableSize * value_bytes);
		offset += tableSize * value_bytes;
		this.T = {
			keys: keys,
			values: values,
			keySize: partial_key_bytes,
			valueSize: value_bytes,
			size: tableSize
		};
		this.depth = _depth;
	}
	get(P) {
		if (P.nbMoves() > this.depth) return 0;
		let key = Number(P.key3());
		return OpeningBook.tableGetterGet(this.T, key);
	}
	static tableGetterGet(T, key) {
		let pos = key % T.size;
		let keyBytes = T.keys.slice(pos * T.keySize, pos * T.keySize + T.keySize);
		let keyBuffer = OpeningBook.numberToBytes(key, T.keySize);
		for (let i = 0; i < T.keySize; i++) {
			if (keyBytes[i] !== keyBuffer[i]) return 0;
		}
		return T.values[pos];
	}
	static numberToBytes(num, byteCount) {
		let arr = new Uint8Array(byteCount);
		for (let i = 0; i < byteCount; i++) {
			arr[i] = num & 0xFF;
			num = num >> 8;
		}
		return arr;
	}
	static nextPrime(n) {
		function isPrime(x) {
			if (x < 2) return false;
			for (let i = 2, r = Math.sqrt(x); i <= r; i++) {
				if (x % i === 0) return false;
			}
			return true;
		}
		while (!isPrime(n)) {
			n++;
		}
		return n;
	}
}
class TranspositionTable {
	constructor(log_size) {
		this.size = TranspositionTable.nextPrime(1 << log_size);
		this.keys = new Array(this.size).fill(0n);
		this.values = new Array(this.size).fill(0);
	}
	reset() {
		this.keys.fill(0n);
		this.values.fill(0);
	}
	index(key) {
		return Number(key % BigInt(this.size));
	}
	put(key, value) {
		let pos = this.index(key);
		this.keys[pos] = key;
		this.values[pos] = value;
	}
	get(key) {
		let pos = this.index(key);
		if (this.keys[pos] === key) return this.values[pos];
		else return 0;
	}
	static nextPrime(n) {
		function isPrime(x) {
			if (x < 2) return false;
			for (let i = 2, r = Math.sqrt(x); i <= r; i++) {
				if (x % i === 0) return false;
			}
			return true;
		}
		while (!isPrime(n)) {
			n++;
		}
		return n;
	}
}
class Solver {
	constructor() {
		this.TABLE_SIZE = 24;
		this.transTable = new TranspositionTable(this.TABLE_SIZE);
		this.book = new OpeningBook(Position.WIDTH, Position.HEIGHT);
		this.nodeCount = 0;
		this.columnOrder = new Array(Position.WIDTH);
		for (let i = 0; i < Position.WIDTH; i++) {
			this.columnOrder[i] = Math.floor(Position.WIDTH / 2) + (1 - 2 * (i % 2)) * Math.floor((i + 1) / 2);
		}
	}
	negamax(P, alpha, beta) {
		this.nodeCount++;
		let possible = P.possibleNonLosingMoves();
		if (possible === 0n)
			return -Math.floor((Position.WIDTH * Position.HEIGHT - P.nbMoves()) / 2);
		if (P.nbMoves() >= Position.WIDTH * Position.HEIGHT - 2)
			return 0;
		let min = -Math.floor((Position.WIDTH * Position.HEIGHT - 2 - P.nbMoves()) / 2);
		if (alpha < min) {
			alpha = min;
			if (alpha >= beta)
				return alpha;
		}
		let max = Math.floor((Position.WIDTH * Position.HEIGHT - 1 - P.nbMoves()) / 2);
		if (beta > max) {
			beta = max;
			if (alpha >= beta)
				return beta;
		}
		let key = P.key();
		let val = this.transTable.get(key);
		if (val) {
			if (val > Position.MAX_SCORE - Position.MIN_SCORE + 1) {
				min = val + 2 * Position.MIN_SCORE - Position.MAX_SCORE - 2;
				if (alpha < min) {
					alpha = min;
					if (alpha >= beta)
						return alpha;
				}
			} else {
				max = val + Position.MIN_SCORE - 1;
				if (beta > max) {
					beta = max;
					if (alpha >= beta)
						return beta;
				}
			}
		}
		val = this.book.get(P);
		if (val)
			return val + Position.MIN_SCORE - 1;
		let moves = new MoveSorter();
		for (let i = Position.WIDTH - 1; i >= 0; i--) {
			let col = this.columnOrder[i];
			let move = possible & Position.column_mask(col);
			if (move)
				moves.add(move, P.moveScore(move));
		}
		while (true) {
			let next = moves.getNext();
			if (next === 0n)
				break;
			let P2 = new Position();
			P2.current_position = P.current_position;
			P2.mask = P.mask;
			P2.moves = P.moves;
			P2.play(next);
			let score = -this.negamax(P2, -beta, -alpha);
			if (score >= beta) {
				this.transTable.put(key, score + Position.MAX_SCORE - 2 * Position.MIN_SCORE + 2);
				return score;
			}
			if (score > alpha)
				alpha = score;
		}
		this.transTable.put(key, alpha - Position.MIN_SCORE + 1);
		return alpha;
	}
	solve(P, weak = false) {
		if (P.canWinNext())
			return Math.floor((Position.WIDTH * Position.HEIGHT + 1 - P.nbMoves()) / 2);
		let min = -Math.floor((Position.WIDTH * Position.HEIGHT - P.nbMoves()) / 2);
		let max = Math.floor((Position.WIDTH * Position.HEIGHT + 1 - P.nbMoves()) / 2);
		if (weak) {
			min = -1;
			max = 1;
		}
		while (min < max) {
			let med = min + Math.floor((max - min) / 2);
			if (med <= 0 && Math.floor(min / 2) < med)
				med = Math.floor(min / 2);
			else if (med >= 0 && Math.floor(max / 2) > med)
				med = Math.floor(max / 2);
			let r = this.negamax(P, med, med + 1);
			if (r <= med)
				max = r;
			else
				min = r;
		}
		return min;
	}
	analyze(P, weak = false) {
		let scores = new Array(Position.WIDTH).fill(Solver.INVALID_MOVE);
		for (let col = 0; col < Position.WIDTH; col++) {
			if (P.canPlay(col)) {
				if (P.isWinningMove(col))
					scores[col] = Math.floor((Position.WIDTH * Position.HEIGHT + 1 - P.nbMoves()) / 2);
				else {
					let P2 = new Position();
					P2.current_position = P.current_position;
					P2.mask = P.mask;
					P2.moves = P.moves;
					P2.playCol(col);
					scores[col] = -this.solve(P2, weak);
				}
			}
		}
		return scores;
	}
}
Solver.INVALID_MOVE = -1000;
let solver = new Solver();
solver.book.load(new Uint8Array(new Brotli().decompressArray(base128Decode('!@'))).buffer);

function getBestMove(sequence) {
	let transformed = "";
	for (let i = 0; i < sequence.length; i++) {
		let digit = parseInt(sequence[i], 10);
		if (isNaN(digit)) {
			throw new Error("Invalid digit in input.");
		}
		transformed += (digit + 1).toString();
	}
	let P = new Position();
	let res = P.playSequence(transformed);
	if (res !== transformed.length) {
		throw new Error("Invalid move at position " + (P.nbMoves() + 1));
	}
	let scores = solver.analyze(P, false);
	let maxScore = Math.max(...scores);
	let bestColumns = [];
	for (let col = 0; col < scores.length; col++) {
		if (scores[col] === maxScore) bestColumns.push(col);
	}
	let randomIndex = Math.floor(Math.random() * bestColumns.length);
	return bestColumns[randomIndex];
}
