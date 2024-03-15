import { Asset } from "expo-asset";
import { readAsStringAsync } from "expo-file-system";
import type { BookName } from "./PlayViewScreen";
import type { TropeType } from "./trope";
import { Platform } from "react-native";

export { audio } from "../data/audio/audioImports";

const jsonCache = new Map<number, Promise<any>>();
const loadJson = async (id: number): Promise<any> => {
  let prom = jsonCache.get(id);
  if (prom != null) return prom;
  prom = Asset.loadAsync(id).then(([{ localUri }]) =>
    Platform.OS === "web"
      ? fetch(localUri!).then((r) => r.json())
      : readAsStringAsync(localUri!).then(JSON.parse),
  );
  jsonCache.set(id, prom);
  return prom;
};

export type Book = string[][][];
export type TransBook = { text: string[][] };
type Labels = Record<string, number[]>;

export const getBook = (book: BookName): Promise<Book> =>
  loadJson(require(`../data/torah/json/${book}.json#res`));
export const getTransBook = (book: BookName): Promise<TransBook> =>
  loadJson(require(`../data/torah/translation/${book}.json#res`));
export const getLabels = (book: BookName): Promise<Labels> =>
  loadJson(require(`../data/torah/labels/${book}.json#res`));

export const hebFont = "Taamey_D";
export const tikkunFont = "StamAshkenazCLM";

export const getTropeAudio = (type: TropeType, trope: string): number =>
  require(`../data/trope/audio/${type}-${trope}.mp3#res`);

type TropeText = {
  title: string;
  tropes: { [trope: string]: { name_he: string; text: string[][] } };
};
export const getTropeText = (type: TropeType): TropeText =>
  require(`../data/trope/text/${type}.json`);

export const getTropeLabels = (type: TropeType): Labels =>
  require(`../data/trope/labels/${type}.json`);
