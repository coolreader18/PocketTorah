const fs = require("fs");
const path = require("path");

const map = {};
for (const fname of fs.readdirSync(__dirname)) {
  if (path.extname(fname) != ".mp3") continue;
  const [book, verse, extra] = path.basename(fname, ".mp3").split("-");
  const kind = extra === "SA" ? "sof" : "reg";
  const verseInfo = ((map[book] ??= {})[verse] ??= { reg: null, sof: null });
  verseInfo[kind] = fname;
}

function genMap(map, exportName) {
  let out = `export const ${exportName} = {\n`;
  for (const [book, verses] of Object.entries(map)) {
    out += `  ${JSON.stringify(book.replace("_", " "))}: {\n`;
    for (const [verse, { reg, sof }] of Object.entries(verses)) {
      const mkRequire = (key, fname) => fname && `${key}: require(${JSON.stringify("./" + fname)})`;
      out += `    ${JSON.stringify(verse.replace("_", ":"))}: () => ({${[mkRequire("reg", reg), mkRequire("sof", sof)]
        .filter(Boolean)
        .join(",")}}),\n`;
    }
    out += "  } as Record<string, () => AudioImport>,\n";
  }
  out += "};\n";
  return out;
}

const out = `// DO NOT EDIT MANUALLY
// run generate-imports.js when you add a new file to this directory

import type { AVPlaybackSource } from "expo-av";
type AudioImport = { reg?: AVPlaybackSource; sof?: AVPlaybackSource };

${genMap(map, "audio")}
`;

fs.writeFileSync(path.resolve(__dirname, "audioImports.ts"), out);
