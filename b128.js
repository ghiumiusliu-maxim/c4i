function base128Decode(l) {
	for (var t = [], a = 0, c = 0, i = 0; i < l.length; i++) {
		for (a = a << 7 | ' 	 !"#$%&()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_`abcdefghijklmnopqrstuvwxyz{|}~'
			.indexOf(l.charAt(i)), c += 7; c >= 8;) c -= 8, t.push(a >> c & 255)
	}
	return new Uint8Array(t)
}
