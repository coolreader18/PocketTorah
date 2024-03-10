import type { BookName } from "./PlayViewScreen";
import type { TropeType } from "./trope";

export { audio } from "../data/audio/audioImports";

export const bookMap = {
  // Import Texts
  Amos: () => import("../data/torah/json/Amos.json"),
  Deuteronomy: () => import("../data/torah/json/Deuteronomy.json"),
  Exodus: () => import("../data/torah/json/Exodus.json"),
  Ezekiel: () => import("../data/torah/json/Ezekiel.json"),
  Genesis: () => import("../data/torah/json/Genesis.json"),
  Hosea: () => import("../data/torah/json/Hosea.json"),
  Isaiah: () => import("../data/torah/json/Isaiah.json"),
  Jeremiah: () => import("../data/torah/json/Jeremiah.json"),
  Joel: () => import("../data/torah/json/Joel.json"),
  Joshua: () => import("../data/torah/json/Joshua.json"),
  Judges: () => import("../data/torah/json/Judges.json"),
  "I Kings": () => import("../data/torah/json/Kings_1.json"),
  "II Kings": () => import("../data/torah/json/Kings_2.json"),
  Leviticus: () => import("../data/torah/json/Leviticus.json"),
  Malachi: () => import("../data/torah/json/Malachi.json"),
  Micah: () => import("../data/torah/json/Micah.json"),
  Numbers: () => import("../data/torah/json/Numbers.json"),
  Obadiah: () => import("../data/torah/json/Obadiah.json"),
  "I Samuel": () => import("../data/torah/json/Samuel_1.json"),
  "II Samuel": () => import("../data/torah/json/Samuel_2.json"),
  Zechariah: () => import("../data/torah/json/Zechariah.json"),
};

type Importer<T> = () => Promise<{ default: T }>;

export const transBookMap = {
  // Import Translations
  Genesis: () => import("../data/torah/translation/Genesis.json"),
  Exodus: () => import("../data/torah/translation/Exodus.json"),
  Deuteronomy: () => import("../data/torah/translation/Deuteronomy.json"),
  Leviticus: () => import("../data/torah/translation/Leviticus.json"),
  Numbers: () => import("../data/torah/translation/Numbers.json"),
  Isaiah: () => import("../data/torah/translation/Isaiah.json"),
  Joshua: () => import("../data/torah/translation/Joshua.json"),
  Judges: () => import("../data/torah/translation/Judges.json"),
  Malachi: () => import("../data/torah/translation/Malachi.json"),
  Obadiah: () => import("../data/torah/translation/Obadiah.json"),
  Micah: () => import("../data/torah/translation/Micah.json"),
  "I Samuel": () => import("../data/torah/translation/Samuel_1.json"),
  "II Samuel": () => import("../data/torah/translation/Samuel_2.json"),
  Zechariah: () => import("../data/torah/translation/Zechariah.json"),
  Joel: () => import("../data/torah/translation/Joel.json"),
  Jeremiah: () => import("../data/torah/translation/Jeremiah.json"),
  Hosea: () => import("../data/torah/translation/Hosea.json"),
  Ezekiel: () => import("../data/torah/translation/Ezekiel.json"),
  Amos: () => import("../data/torah/translation/Amos.json"),
  "II Kings": () => import("../data/torah/translation/Kings_2.json"),
  "I Kings": () => import("../data/torah/translation/Kings_1.json"),
};

export const labels: Record<BookName, Importer<Record<string, number[]>>> = {
  Amos: () => import("../data/torah/labels/Amos.json"),
  Deuteronomy: () => import("../data/torah/labels/Deuteronomy.json"),
  Exodus: () => import("../data/torah/labels/Exodus.json"),
  Ezekiel: () => import("../data/torah/labels/Ezekiel.json"),
  Genesis: () => import("../data/torah/labels/Genesis.json"),
  Hosea: () => import("../data/torah/labels/Hosea.json"),
  Isaiah: () => import("../data/torah/labels/Isaiah.json"),
  Jeremiah: () => import("../data/torah/labels/Jeremiah.json"),
  Joel: () => import("../data/torah/labels/Joel.json"),
  Joshua: () => import("../data/torah/labels/Joshua.json"),
  Judges: () => import("../data/torah/labels/Judges.json"),
  "I Kings": () => import("../data/torah/labels/I Kings.json"),
  "II Kings": () => import("../data/torah/labels/II Kings.json"),
  Leviticus: () => import("../data/torah/labels/Leviticus.json"),
  Malachi: () => import("../data/torah/labels/Malachi.json"),
  Micah: () => import("../data/torah/labels/Micah.json"),
  Numbers: () => import("../data/torah/labels/Numbers.json"),
  Obadiah: () => import("../data/torah/labels/Obadiah.json"),
  "I Samuel": () => import("../data/torah/labels/I Samuel.json"),
  "II Samuel": () => import("../data/torah/labels/II Samuel.json"),
  Zechariah: () => import("../data/torah/labels/Zechariah.json"),
};

export const hebFont = "Taamey_D";
export const tikkunFont = "StamAshkenazCLM";
export const fonts = {
  [hebFont]: require("../fonts/Taamey_D.woff2"),
  [tikkunFont]: require("../fonts/StamAshkenazCLM.woff2"),
};

export const tropeAudio: { [k in TropeType]: { [trope: string]: any } } = {
  torah: {
    etnachta: require("../data/trope/audio/torah-etnachta.mp3"),
    sof_pasuk: require("../data/trope/audio/torah-sof_pasuk.mp3"),
    zakef_katan: require("../data/trope/audio/torah-zakef_katan.mp3"),
    revii: require("../data/trope/audio/torah-revii.mp3"),
    kadma_vazlan: require("../data/trope/audio/torah-kadma_vazlan.mp3"),
    geresh_gershayim: require("../data/trope/audio/torah-geresh_gershayim.mp3"),
    tevir: require("../data/trope/audio/torah-tevir.mp3"),
    telisha: require("../data/trope/audio/torah-telisha.mp3"),
    pazer: require("../data/trope/audio/torah-pazer.mp3"),
    yetiv_katom: require("../data/trope/audio/torah-yetiv_katom.mp3"),
    zakef_gadol: require("../data/trope/audio/torah-zakef_gadol.mp3"),
    zarka: require("../data/trope/audio/torah-zarka.mp3"),
  },
  haftarah: {
    etnachta: require("../data/trope/audio/haftarah-etnachta.mp3"),
    sof_pasuk: require("../data/trope/audio/haftarah-sof_pasuk.mp3"),
    katon: require("../data/trope/audio/haftarah-katon.mp3"),
    revii: require("../data/trope/audio/haftarah-revii.mp3"),
    tevir: require("../data/trope/audio/haftarah-tevir.mp3"),
    geresh: require("../data/trope/audio/haftarah-geresh.mp3"),
    gershayim: require("../data/trope/audio/haftarah-gershayim.mp3"),
    telisha: require("../data/trope/audio/haftarah-telisha.mp3"),
    yetiv_katom: require("../data/trope/audio/haftarah-yetiv_katom.mp3"),
    zakef_gadol: require("../data/trope/audio/haftarah-zakef_gadol.mp3"),
    zarka: require("../data/trope/audio/haftarah-zarka.mp3"),
    pazer: require("../data/trope/audio/haftarah-pazer.mp3"),
    kadma_vazlan: require("../data/trope/audio/haftarah-kadma_vazlan.mp3"),
    mercha_kefulah: require("../data/trope/audio/haftarah-mercha_kefulah.mp3"),
    sof_haftorah: require("../data/trope/audio/haftarah-sof_haftorah.mp3"),
  },
  esther: {
    etnachta: require("../data/trope/audio/esther-etnachta.mp3"),
    sof_pasuk: require("../data/trope/audio/esther-sof_pasuk.mp3"),
    katon: require("../data/trope/audio/esther-katon.mp3"),
    revii: require("../data/trope/audio/esther-revii.mp3"),
    tevir: require("../data/trope/audio/esther-tevir.mp3"),
    geresh: require("../data/trope/audio/esther-geresh.mp3"),
    gershayim: require("../data/trope/audio/esther-gershayim.mp3"),
    telisha: require("../data/trope/audio/esther-telisha.mp3"),
    yetiv_katom: require("../data/trope/audio/esther-yetiv_katom.mp3"),
    zakef_gadol: require("../data/trope/audio/esther-zakef_gadol.mp3"),
    zarka: require("../data/trope/audio/esther-zarka.mp3"),
    pazer: require("../data/trope/audio/esther-pazer.mp3"),
    kadma_vazlan: require("../data/trope/audio/esther-kadma_vazlan.mp3"),
    sof_perek: require("../data/trope/audio/esther-sof_perek.mp3"),
    karnei_parah: require("../data/trope/audio/esther-karnei_parah.mp3"),
    yerech_ben_yomo: require("../data/trope/audio/esther-yerech_ben_yomo.mp3"),
  },
  eicha: {
    etnachta: require("../data/trope/audio/eicha-etnachta.mp3"),
    sof_pasuk: require("../data/trope/audio/eicha-sof_pasuk.mp3"),
    pashta_katon: require("../data/trope/audio/eicha-pashta_katon.mp3"),
    revii: require("../data/trope/audio/eicha-revii.mp3"),
    tevir: require("../data/trope/audio/eicha-tevir.mp3"),
    geresh: require("../data/trope/audio/eicha-geresh.mp3"),
    gershayim: require("../data/trope/audio/eicha-gershayim.mp3"),
    telisha: require("../data/trope/audio/eicha-telisha.mp3"),
    yetiv_katom: require("../data/trope/audio/eicha-yetiv_katom.mp3"),
    zakef_gadol: require("../data/trope/audio/eicha-zakef_gadol.mp3"),
    zarka: require("../data/trope/audio/eicha-zarka.mp3"),
    end_of_chapter: require("../data/trope/audio/eicha-end_of_chapter.mp3"),
  },
  "3megillot": {
    etnachta: require("../data/trope/audio/3megillot-etnachta.mp3"),
    sof_pasuk: require("../data/trope/audio/3megillot-sof_pasuk.mp3"),
    katon: require("../data/trope/audio/3megillot-katon.mp3"),
    revii: require("../data/trope/audio/3megillot-revii.mp3"),
    tevir: require("../data/trope/audio/3megillot-tevir.mp3"),
    geresh: require("../data/trope/audio/3megillot-geresh.mp3"),
    gershayim: require("../data/trope/audio/3megillot-gershayim.mp3"),
    telisha: require("../data/trope/audio/3megillot-telisha.mp3"),
    yetiv_katom: require("../data/trope/audio/3megillot-yetiv_katom.mp3"),
    zakef_gadol: require("../data/trope/audio/3megillot-zakef_gadol.mp3"),
    zarka: require("../data/trope/audio/3megillot-zarka.mp3"),
    pazer: require("../data/trope/audio/3megillot-pazer.mp3"),
    kadma_vazlan: require("../data/trope/audio/3megillot-kadma_vazlan.mp3"),
    sof_perek: require("../data/trope/audio/3megillot-sof_perek.mp3"),
  },
  hhd: {
    etnachta: require("../data/trope/audio/hhd-etnachta.mp3"),
    sof_pasuk: require("../data/trope/audio/hhd-sof_pasuk.mp3"),
    katon: require("../data/trope/audio/hhd-katon.mp3"),
    revii: require("../data/trope/audio/hhd-revii.mp3"),
    tevir: require("../data/trope/audio/hhd-tevir.mp3"),
    geresh: require("../data/trope/audio/hhd-geresh.mp3"),
    gershayim: require("../data/trope/audio/hhd-gershayim.mp3"),
    telisha: require("../data/trope/audio/hhd-telisha.mp3"),
    yetiv_katom: require("../data/trope/audio/hhd-yetiv_katom.mp3"),
    zakef_gadol: require("../data/trope/audio/hhd-zakef_gadol.mp3"),
    zarka: require("../data/trope/audio/hhd-zarka.mp3"),
    pazer: require("../data/trope/audio/hhd-pazer.mp3"),
    kadma_vazlan: require("../data/trope/audio/hhd-kadma_vazlan.mp3"),
    sof_perek: require("../data/trope/audio/hhd-sof_perek.mp3"),
  },
};

export const tropeText: {
  [k in TropeType]: () => {
    title: string;
    tropes: { [trope: string]: { name_he: string; text: string[][] } };
  };
} = {
  torah: () => require("../data/trope/text/torah.json"),
  haftarah: () => require("../data/trope/text/haftarah.json"),
  esther: () => require("../data/trope/text/esther.json"),
  eicha: () => require("../data/trope/text/eicha.json"),
  "3megillot": () => require("../data/trope/text/3megillot.json"),
  hhd: () => require("../data/trope/text/hhd.json"),
};

export const tropeLabels = {
  torah: require("../data/trope/labels/torah.json"),
  haftarah: require("../data/trope/labels/haftarah.json"),
  esther: require("../data/trope/labels/esther.json"),
  eicha: require("../data/trope/labels/eicha.json"),
  "3megillot": require("../data/trope/labels/3megillot.json"),
  hhd: require("../data/trope/labels/hhd.json"),
};
