const BRANCH_STR = [
	"└──",

	"├──",

	"│",
];

type Color = [number, number, number];

export type TreefyOptions = {
	colors?: boolean;
	indentSize?: number;

	// Tree colors
	arrowsColor?: [Color, Color];
	titleColor?: [Color, Color];
	keyColor?: [Color, Color];

	// Literal colors
	numberColor?: [Color, Color];
	bigIntColor?: [Color, Color];
	stringColor?: [Color, Color];
	booleanColor?: [Color, Color];
};

export function treefy(tree: Object, options: TreefyOptions = {}): string {
	const {
		colors = true,
		indentSize = 2,
		titleColor = [fromHex("#00ff7f"), fromHex(null)],
		keyColor = [fromHex("#33daff"), fromHex(null)],
		arrowsColor = [fromHex("#ffffff"), fromHex(null)],
		numberColor = [fromHex("#ff9605"), fromHex(null)],
		bigIntColor = [fromHex("#c299ff"), fromHex(null)],
		stringColor = [fromHex("#FFCA68"), fromHex(null)],
		booleanColor = [fromHex("#ff516d"), fromHex(null)]
	} = options;

	const applyColor = (str: string, c: [Color, Color]) => colors ? colorfy(str, c[0], c[1]) : str;

	const arrows = [
		applyColor("├", arrowsColor),
		applyColor("└", arrowsColor),
		applyColor("│", arrowsColor),
		applyColor("─".repeat(indentSize), arrowsColor)
	];
	const arrow = (type: number): string => {
		switch (type) {
			case 0:
				return arrows[0] + arrows[3];
			case 1:
				return arrows[1] + arrows[3];
			case 2:
				return arrows[2];
		}
		return null;
	}

	const indent = (lvl: number) => " ".repeat(lvl * (indentSize + 1));

	const connect = (str: string, lvl: number, skipFirst: boolean = false): string => {
		const lines = str.split("\n");

		return lines.map((line, idx) => {
			if (skipFirst && idx === 0) return line;
			if (idx < lines.length - 1) {
				const p = lvl * (indentSize + 1);
				line = line.slice(0, p) + arrow(2) + line.slice(p + 1);
			}
			return line;
		}).join("\n");
	};

	const treefyRec = (obj: Object, lvl: number): string => {
		if (obj === null) return "null\n";

		let str = "";

		str += applyColor(obj['title'] || 'Object', titleColor) + "\n";

		const keys = Object.keys(obj).filter(k => k !== 'title');
		const numKeys = keys.length;

		for (let i = 0; i < numKeys; i++) {
			const k = keys[i];
			const v = obj[k];

			if (i < numKeys - 1) {
				str += indent(lvl) + arrow(0);
			} else {
				str += indent(lvl) + arrow(1);
			}

			if (typeof v === 'object') {
				str += applyColor(k, keyColor) + "\n";
				let sss = "";

				if (Array.isArray(v)) {
					const len = v.length;

					for (let j = 0; j < len; j++) {
						let ss = indent(lvl + 1);
						if (j < len - 1) {
							ss += arrow(0);
						} else {
							ss += arrow(1);
						}

						ss += treefyRec(v[j], lvl + 2);

						if (j < len - 1) {
							ss = connect(ss, lvl + 1, true);
						}

						sss += ss;
					}

					if (i < numKeys - 1) {
						sss = connect(sss, lvl);
					}

					str += sss;
				} else {
					let ss = indent(lvl + 1) + arrow(1);
					ss += treefyRec(v, lvl + 2);

					if (i < numKeys - 1) {
						ss = connect(ss, lvl);
					}

					str += ss;
				}
			} else {
				const ks = applyColor(k, keyColor);
				let vs = `${v}`;

				if (typeof v === 'number') {
					vs = applyColor(`${v}`, numberColor);
				} else if (typeof v === 'bigint') {
					vs = applyColor(`BigInt(${v})`, bigIntColor);
				} else if (typeof v === 'string') {
					vs = applyColor(`"${v}"`, stringColor);
				} else if (typeof v === 'boolean') {
					vs = applyColor(v ? "true" : "false", booleanColor);
				}

				str += `${ks}: ${vs}\n`;
			}
		}

		return str;
	};

	const s = treefyRec(tree, 0);

	return s.slice(0, s.length - 1);
}

export function foreground(rgb: Color): string {
	let [r, g, b] = rgb;

	r = r < 0 ? 0 : r > 255 ? 255 : r;
	g = g < 0 ? 0 : g > 255 ? 255 : g;
	b = b < 0 ? 0 : b > 255 ? 255 : b;

	return `\x1b[38;2;${r};${g};${b}m`;
}

export function foregroundReset(): string {
	return `\x1b[37m`;
}

export function background(rgb: Color): string {
	let [r, g, b] = rgb;

	r = r < 0 ? 0 : r > 255 ? 255 : r;
	g = g < 0 ? 0 : g > 255 ? 255 : g;
	b = b < 0 ? 0 : b > 255 ? 255 : b;

	return `\x1b[48;2;${r};${g};${b}m`;
}

export function backgroundReset(): string {
	return `\x1b[40m`;
}

export function colorfy(str: string, fg: Color, bg: Color = null): string {
	let ss = "";

	ss += foreground(fg);
	if (bg) {
		ss += background(bg);
	}

	ss += str;

	ss += foregroundReset();
	ss += backgroundReset();

	return ss;
}

export function fromHex(hex: string): Color {
	if (hex === null) return null;

	const m = (/#?([0-9a-fA-F]{1,2})([0-9a-fA-F]{1,2})([0-9a-fA-F]{1,2})/).exec(hex);
	if (m) {
		let [_, r, g, b] = m;

		return [
			parseInt(r, 16),
			parseInt(g, 16),
			parseInt(b, 16)
		];
	} else {
		throw new Error(`Wrong format`);
	}
}

export function unescapeString(str: string): string {
	// Replace basic escape characters
	str = str
		.replace(/\\'/g, "\'")
		.replace(/\\"/g, "\"")
		.replace(/\\\\/g, "\\")
		.replace(/\\n/g, "\n")
		.replace(/\\r/g, "\r")
		.replace(/\\b/g, "\b")
		.replace(/\\f/g, "\f")
		.replace(/\\v/g, "\v")
		.replace(/\\e/g, "\x1b")
		.replace(/\\0/g, "\0")
		;

	// Hexadecimal characters
	str = str.replace(/\\x([0-9a-fA-F][0-9a-fA-F])/g, (match, d: string) => {

		return String.fromCharCode(parseInt(d, 16));
	});

	return str;
}

export function getType(v: any): string {
	if (typeof v === 'object') {
		if (v.constructor) {
			return v.constructor.name;
		}
		return ({}).toString.call(v);
	} else {
		return typeof v;
	}
}

export function lineColumnFromString(str: string, cursor: number): [number, number] {
	let [cursorLine, cursorColumn] = [0, -1];
	for (let i = 0; i <= cursor; i++) {
		const c = str[i];
		if (c !== "\r") cursorColumn += 1;
		if (c === "\t") cursorColumn += 3;
		if (c === "\n") {
			cursorLine += 1;
			cursorColumn = -1;
		}
	}
	return [cursorLine, cursorColumn];
}