import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import { parseDocument } from "htmlparser2";
import { type VerseData } from "./PlayViewScreen";
import { getElementsByTagName, textContent } from "domutils";

export const parseXML = async (asset: Asset): Promise<VerseData[]> => {
  await asset.downloadAsync();
  const str = await FileSystem.readAsStringAsync(asset.localUri!);
  const doc = parseDocument(str);
  return getElementsByTagName("v", [doc.firstChild!]).map((verseEl) => ({
    words: getElementsByTagName("w", verseEl.children).map(textContent),
  }));
};
