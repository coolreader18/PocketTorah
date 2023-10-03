import { Asset } from "expo-asset";
import { type VerseData } from "./PlayViewScreen";

export const parseXML = async (asset: Asset): Promise<VerseData[]> => {
  await asset.downloadAsync();
  const doc = await doXHR(asset.localUri ?? asset.uri);
  return Array.from(doc.getElementsByTagName("v")).map((verseEl) => ({
    words: Array.from(verseEl.getElementsByTagName("w")).map((wordEl) => wordEl.textContent ?? ""),
  }));
};

const doXHR = (uri: string): Promise<XMLDocument> =>
  new Promise((res, rej) => {
    const xhr = new XMLHttpRequest();
    xhr.responseType = "document";
    xhr.addEventListener("load", () => res(xhr.response));
    xhr.addEventListener("error", () => rej(xhr.statusText));
    xhr.open("GET", uri);
    xhr.send();
  });
