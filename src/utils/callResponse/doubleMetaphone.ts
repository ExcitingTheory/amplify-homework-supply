export type DoubleMetaphoneCode = readonly [primary: string, secondary: string];

const VOWELS = new Set(["A", "E", "I", "O", "U", "Y"]);

export function doubleMetaphone(value: string): DoubleMetaphoneCode {
  const word = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
  if (!word) return ["", ""];

  let index = /^(GN|KN|PN|WR|PS)/.test(word) ? 1 : 0;
  let primary = "";
  let secondary = "";

  const append = (first: string, second = first) => {
    primary += first.slice(0, Math.max(0, 4 - primary.length));
    secondary += second.slice(0, Math.max(0, 4 - secondary.length));
  };
  const at = (offset: number) => word[index + offset] ?? "";
  const starts = (value: string) => word.startsWith(value, index);

  while (index < word.length && (primary.length < 4 || secondary.length < 4)) {
    const character = word[index]!;
    if (VOWELS.has(character)) {
      if (index === 0) append("A");
      index += 1;
      continue;
    }

    switch (character) {
      case "B":
        append("P");
        index += at(1) === "B" ? 2 : 1;
        break;
      case "C":
        if (starts("CH")) {
          append("X", "K");
          index += 2;
        } else if (starts("CIA") || starts("CIO") || starts("CIE")) {
          append("X", "S");
          index += 2;
        } else if (starts("CC")) {
          if (/[IEH]/.test(at(2)) && at(3) !== "H") append("X", "K");
          else append("K");
          index += 2;
        } else if (/[IEY]/.test(at(1))) {
          append("S");
          index += 1;
        } else {
          append("K");
          index += at(1) === "C" || at(1) === "K" || at(1) === "Q" ? 2 : 1;
        }
        break;
      case "D":
        if (/^DG[IEY]/.test(word.slice(index))) {
          append("J");
          index += 3;
        } else {
          append("T");
          index += starts("DD") || starts("DT") ? 2 : 1;
        }
        break;
      case "F":
        append("F");
        index += at(1) === "F" ? 2 : 1;
        break;
      case "G":
        if (starts("GH")) {
          if (index > 0 && !VOWELS.has(at(-1))) append("K");
          else if (index === 0 && at(2) === "I") append("J", "K");
          index += 2;
        } else if (starts("GN")) {
          append("N", "KN");
          index += 2;
        } else if (/[IEY]/.test(at(1))) {
          append("J", "K");
          index += 1;
        } else {
          append("K");
          index += at(1) === "G" ? 2 : 1;
        }
        break;
      case "H":
        if (
          (index === 0 || VOWELS.has(at(-1))) &&
          VOWELS.has(at(1))
        ) {
          append("H");
          index += 2;
        } else {
          index += 1;
        }
        break;
      case "J":
        append("J", index === 0 ? "A" : "J");
        index += at(1) === "J" ? 2 : 1;
        break;
      case "K":
        append("K");
        index += at(1) === "K" ? 2 : 1;
        break;
      case "L":
        append("L");
        index += at(1) === "L" ? 2 : 1;
        break;
      case "M":
        append("M");
        index += at(1) === "M" ? 2 : 1;
        break;
      case "N":
        append("N");
        index += at(1) === "N" ? 2 : 1;
        break;
      case "P":
        append(starts("PH") ? "F" : "P");
        index += starts("PH") || at(1) === "P" ? 2 : 1;
        break;
      case "Q":
        append("K");
        index += at(1) === "Q" ? 2 : 1;
        break;
      case "R":
        append("R");
        index += at(1) === "R" ? 2 : 1;
        break;
      case "S":
        if (starts("SCH")) {
          append("X", "S");
          index += 3;
        } else if (starts("SH")) {
          append("X");
          index += 2;
        } else if (starts("SIO") || starts("SIA")) {
          append("X", "S");
          index += 3;
        } else {
          append("S");
          index += at(1) === "S" || at(1) === "Z" ? 2 : 1;
        }
        break;
      case "T":
        if (starts("TCH")) {
          index += 3;
        } else if (starts("TH")) {
          append("0", "T");
          index += 2;
        } else if (starts("TIA") || starts("TIO")) {
          append("X");
          index += 3;
        } else if (starts("TION")) {
          append("X");
          index += 3;
        } else {
          append("T");
          index += at(1) === "T" || at(1) === "D" ? 2 : 1;
        }
        break;
      case "V":
        append("F");
        index += at(1) === "V" ? 2 : 1;
        break;
      case "W":
        if (starts("WH")) {
          append("A", "F");
          index += 2;
        } else if (index === 0 && VOWELS.has(at(1))) {
          append("A", "F");
          index += 1;
        } else if (index === word.length - 1 && VOWELS.has(at(-1))) {
          append("F");
          index += 1;
        } else {
          index += at(1) === "W" ? 2 : 1;
        }
        break;
      case "X":
        append(index === 0 ? "S" : "KS");
        index += at(1) === "X" ? 2 : 1;
        break;
      case "Z":
        if (starts("ZH")) {
          append("J", "X");
          index += 2;
        } else {
          append("S", "TS");
          index += at(1) === "Z" ? 2 : 1;
        }
        break;
      default:
        index += 1;
    }
  }

  return [primary, secondary];
}
