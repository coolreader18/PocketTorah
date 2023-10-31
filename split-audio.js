const leyning = require("@hebcal/leyning");
const fs = require("fs");
const path = require("path");

/** @typedef {import("./src/App").Parshah} Parsha */
/** @typedef {{ [book: string]: { [verse: string]: { src: `${Parsha}-${1|2|3|4|5|6|7}`, start_time: number, end_time?: number, labels: number[] } } }} VerseMap */

const ensureArray = (x) => (Array.isArray(x) ? x : [x]);

function split_audio() {
  /** @type {VerseMap} */ const out = {};
  for (const parsha of /** @type {Parsha[]} */ (Object.keys(audio_map))) {
    const { fullkriyah, haft } = leyning.getLeyningForParsha(parsha);
    fullkriyah.H = haft;
    // adjustments to the leyning info where the recordings are different from the hebcal results
    if (parsha === "Masei") {
      fullkriyah[1].e = "33:9";
      fullkriyah[2].b = "33:10";
    } else if (parsha === "Vayeilech") {
      fullkriyah.H = { k: "Joel", b: "2:15", e: "2:27" };
    } else if (parsha === "Achrei Mot") {
      fullkriyah.H.e = "22:16";
    }
    for (const num of [1, 2, 3, 4, 5, 6, 7, "H"]) {
      /** @type {number[]} */
      const labels = book_labels[parsha][num];
      const aliyah = ensureArray(fullkriyah[num]);
      const verses = extractVerseData(
        aliyah,
        aliyah.map((x) => books[x.k])
      );
      let curWordIndex = 0;
      for (const verse of verses) {
        const nextWordIndex = curWordIndex + verse.words.length;
        const start_time = labels[curWordIndex];
        (out[verse.book] ??= {})[`${verse.chapterVerse[0] + 1}:${verse.chapterVerse[1] + 1}`] = {
          src: `${audio_map[parsha]}-${num}`,
          start_time,
          end_time: labels[nextWordIndex],
          sof_aliyah: labels[nextWordIndex] == null,
          labels: labels
            .slice(curWordIndex, nextWordIndex)
            .map((x) => Math.round((x - start_time) * 1e10) / 1e10),
        };
        curWordIndex = nextWordIndex;
      }
    }
  }
  return out;
}

/** @returns {[number, number]} */
function parseChV(s) {
  const [ch, v] = s.split(":");
  return [parseInt(ch) - 1, parseInt(v) - 1];
}

const extractVerseData = (aliyah, book) =>
  aliyah.flatMap((aliyah, i) => {
    const b = book[i].Tanach.tanach.book;
    // these values are 0-indexed and **inclusive**
    const [begChapter, begVerse] = parseChV(aliyah.b);
    const [endChapter, endVerse] = parseChV(aliyah.e);
    return b.c.flatMap((c, cNum) => {
      if (cNum < begChapter || cNum > endChapter) return [];
      const verses = c.v.map((v, vNum) => ({
        book: aliyah.k,
        chapterVerse: [cNum, vNum],
        words: v.w,
      }));
      const sliceStart = cNum === begChapter ? begVerse : 0;
      const sliceEnd = cNum === endChapter ? endVerse + 1 : verses.length;
      return sliceStart === 0 && sliceEnd === verses.length
        ? verses
        : verses.slice(sliceStart, sliceEnd);
    });
  });

const audio_map = {
  Bereshit: "Bereshit",
  Noach: "Noach",
  "Lech-Lecha": "Lech-Lecha",
  Vayera: "Vayera",
  "Chayei Sara": "ChayeiSara",
  Toldot: "Toldot",
  Vayetzei: "Vayetzei",
  Vayishlach: "Vayishlach",
  Vayeshev: "Vayeshev",
  Miketz: "Miketz",
  Vayigash: "Vayigash",
  Vayechi: "Vayechi",
  Shemot: "Shemot",
  Vaera: "Vaera",
  Bo: "Bo",
  Beshalach: "Beshalach",
  Yitro: "Yitro",
  Mishpatim: "Mishpatim",
  Terumah: "Terumah",
  Tetzaveh: "Tetzaveh",
  "Ki Tisa": "KiTisa",
  Vayakhel: "Vayakhel",
  Pekudei: "Pekudei",
  Vayikra: "Vayikra",
  Tzav: "Tzav",
  Shmini: "Shmini",
  Tazria: "Tazria",
  Metzora: "Metzora",
  "Achrei Mot": "AchreiMot",
  Kedoshim: "Kedoshim",
  Emor: "Emor",
  Behar: "Behar",
  Bechukotai: "Bechukotai",
  Bamidbar: "Bamidbar",
  Nasso: "Nasso",
  "Beha'alotcha": "Behaalotcha",
  "Sh'lach": "Shlach",
  Korach: "Korach",
  Chukat: "Chukat",
  Balak: "Balak",
  Pinchas: "Pinchas",
  Matot: "Matot",
  Masei: "Masei",
  Devarim: "Devarim",
  Vaetchanan: "Vaethanan",
  Eikev: "Eikev",
  "Re'eh": "Reeh",
  Shoftim: "Shoftim",
  "Ki Teitzei": "KiTeitzei",
  "Ki Tavo": "KiTavo",
  Nitzavim: "Nitzavim",
  Vayeilech: "Vayeilech",
  "Ha'azinu": "Haazinu",
  "Vezot Haberakhah": "VezotHaberakhah",
};

const book_labels = {};
for (const book_name of leyning.BOOK.slice(1)) {
  Object.assign(book_labels, require(`./old_data/torah/labels/${book_name}.json`));
}
const books = {};
for (const fname of fs.readdirSync("./data/torah/json")) {
  let book_name = path.basename(fname, ".json");
  book_name =
    { Samuel_1: "I Samuel", Samuel_2: "II Samuel", Kings_1: "I Kings", Kings_2: "II Kings" }[
      book_name
    ] ?? book_name;
  books[book_name] = require(`./data/torah/json/${fname}`);
}

const all = [];
const mk = [];

const out = split_audio();
for (const [book_name, verses] of Object.entries(out)) {
  fs.writeFileSync(
    `data/torah/labels/${book_name}.json`,
    JSON.stringify(Object.fromEntries(Object.entries(verses).map(([k, v]) => [k, v.labels])))
  );
}

const map = {};
for (const [book_name, verse, { src, start_time, end_time, sof_aliyah }] of Object.entries(
  out
).flatMap(([k, v]) => Object.entries(v).map(([kv, v]) => [k, kv, v]))) {
  map[src] ??= { targets: [], cmds: [] };
  const outfile = `${book_name.replace(" ", "_")}-${verse.replace(":", "_")}${sof_aliyah ? `-SA` : ""}.mp3`;
  const esc_outfile = outfile.replace(":", "\\:");
  all.push(esc_outfile);

  const to_param = end_time == null ? "" : ` -to ${end_time}`;
  map[src].targets.push(esc_outfile);
  map[src].cmds.push(`-ss ${start_time}${to_param} -codec copy ./${outfile}`);
  // mk.push(
  //   `${outfile}: ../data/audio/${src}.mp3\n\tffmpeg -y -loglevel error -ss ${start_time}${to_param} -i $< -codec copy ./$@`,
  // );
}
mk.push(
  ...Object.entries(map).map(
    ([src, { targets, cmds }]) =>
      `${targets.join(" ")}: ../../old_data/audio/${src}.mp3
	ffmpeg -y -loglevel error -i $< ${cmds.join(" ")}`
  )
);

fs.writeFileSync(
  "data/audio/Makefile",
  `all: ${all.join(" ")}
clean:
	rm -f *.mp3
${mk.join("\n")}`
);
