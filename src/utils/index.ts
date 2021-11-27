const BRANCH_STR = [
	"└──",

	"├──",
	
	"│",
];

type Color = [number, number, number];

export type TreefyOptions = {
	colors?: boolean;
	arrowsColor?: Color;
	titleColor?: Color;
	keyColor?: Color;

	// Literals
	numberColor?: Color;
	stringColor?: Color;
	booleanColor?: Color;
};

export function treefy(tree: Object, options: TreefyOptions = {}): string {
	const {
		colors 		 =	true,
		titleColor 	 = 	[51 , 255, 180],
		keyColor 	 = 	[61 , 219, 214],
		arrowsColor  = 	[255, 255, 255],
		numberColor  = 	[255, 174, 112],
		stringColor  = 	[219, 255, 140],
		booleanColor = 	[255, 143, 165],
	} = options;

	const applyColor = (str: string, c: Color) => colors ? colorfy(str, c) : str;
	
	const arrows = [
		applyColor("├──", arrowsColor),
		applyColor("└──", arrowsColor),
		applyColor("│", arrowsColor)
	];

	const indent = (lvl: number) => "   ".repeat(lvl);

	const connect = (str: string, lvl: number, skipFirst: boolean = false): string => {
		const lines = str.split("\n");

		return lines.map((line, idx) => {
			if (skipFirst && idx === 0) return line;
			if (idx < lines.length - 1) {
				const p = lvl * 3;
				line = line.slice(0, p) + arrows[2] + line.slice(p + 1);
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
				str += indent(lvl) + arrows[0];
			} else {
				str += indent(lvl) + arrows[1];
			}

			if (typeof v === 'object') {
				str += applyColor(k, keyColor) + "\n";
				let sss = "";

				if (Array.isArray(v)) {
					const len = v.length;

					for (let j = 0; j < len; j++) {
						let ss = indent(lvl + 1);
						if (j < len - 1) {
							ss += arrows[0];
						} else {
							ss += arrows[1];
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
					let ss = indent(lvl + 1) + arrows[1];
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
				} else if (typeof v === 'string') {
					vs = applyColor(`"${v}"`, stringColor);
				} else if (typeof v === 'boolean') {
					vs = applyColor(v ? "true": "false", booleanColor);
				}

				str += `${ks}: ${vs}\n`;
			}
		}

		return str;
	};

	const s = treefyRec(tree, 0);

	return s.slice(0, s.length - 1);
}

export function colorfy(str: string, rgb: Color): string {
	let [r, g, b] = rgb;

	r = r < 0 ? 0 : r > 255 ? 255 : r;
	g = g < 0 ? 0 : g > 255 ? 255 : g;
	b = b < 0 ? 0 : b > 255 ? 255 : b;

	return `\x1b[0;38;2;${r};${g};${b}m${str}\x1b[m`;
}

export function unescapeString(str: string): string {
	// Replace basic escape characters
	str = str	
	.replace(/\\'/g, 	"\'")
	.replace(/\\"/g, 	"\"")
	.replace(/\\\\/g, 	"\\")
	.replace(/\\n/g, 	"\n")
	.replace(/\\r/g, 	"\r")
	.replace(/\\b/g, 	"\b")
	.replace(/\\f/g, 	"\f")
	.replace(/\\v/g, 	"\v")
	.replace(/\\0/g, 	"\0")
	;

	// Hexadecimal characters
	str = str.replace(/\\x([0-9a-fA-F][0-9a-fA-F])/g, (match, d: string) => {
		const hc1 = d.toUpperCase().charCodeAt(0);
		const hc2 = d.toUpperCase().charCodeAt(1);
		let res = 0;

		if (hc1 >= 48 && hc1 <= 57) {
			res += (hc1 - 48) * 16;
		} else if (hc1 >= 65) {
			res += (hc1 - 65 + 10) * 16;
		}
		if (hc2 >= 48 && hc2 <= 57) {
			res += (hc2 - 48);
		} else if (hc2 >= 65) {
			res += (hc2 - 65 + 10);
		}

		return String.fromCharCode(res);
	});

	return str;
}
