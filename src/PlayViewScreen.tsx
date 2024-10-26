import { Aliyah } from "@hebcal/leyning";
import binarySearch from "binary-search";
import { AVPlaybackSource } from "expo-av";
import React, { useMemo, useState } from "react";
import useFonts from "../fonts";
import * as RN from "react-native";
import { ActivityIndicator, Button, ScrollView, TouchableOpacity, View } from "react-native";
import { aliyahName, AliyahNum, NavigationProp, ScreenProps } from "./App";
import { SettingsModal } from "./SettingsScreen";
import {
  Book,
  TransBook,
  audio as audioMap,
  getBook,
  getLabels,
  getTransBook,
  hebFont,
  tikkunFont,
} from "./assetImports";
import { Reading, fixReadingId, getLeyning } from "./leyning";
import { numverses } from "./numVerses";
import { useSettings } from "./settings";
import {
  CustomButton,
  Footer,
  FooterButton,
  HeaderContainer,
  Text,
  useNavigationTheme,
  useStyles,
} from "./theming";
import TropeIcon from "./trope-icon.svg";
import { useAudio } from "./useAudio";
import {
  Maybe,
  boolQuery,
  ensureArrayOrNull,
  usePromise,
  useScreenOptions,
  useScreenTitle,
} from "./utils";

export type BookName = keyof typeof audioMap;

const getReading = (leyning: Reading, num: AliyahNum) =>
  ensureArrayOrNull(num === "H" ? leyning.haftara : leyning.aliyot[num]);

export function PlayViewScreen({ route, navigation }: ScreenProps<"PlayViewScreen">) {
  const { params } = route;
  const [translationOn, setTranslationOn] = useState(false);
  const [tikkunOn, setTikkunOn] = useState(false);
  const buttons = (
    <>
      <FooterButton
        key="trans"
        onPress={() => setTranslationOn((b) => !b)}
        buttonTitle={translationOn ? "Translation Off" : "Translation On"}
      />
      <FooterButton
        key="tikkun"
        onPress={() => setTikkunOn((b) => !b)}
        buttonTitle={tikkunOn ? "Tikkun Off" : "Tikkun On"}
      />
    </>
  );

  const readingId = fixReadingId(params.readingId);
  const [{ tri: settingsTri, il }] = useSettings();
  const tri = boolQuery(route.params.tri) ?? settingsTri;
  const leyning = useMemo(() => getLeyning(readingId, { tri, il }), [readingId, tri, il]);

  useScreenTitle(navigation, leyning?.name.en?.concat(`, ${aliyahName(params.aliyah)}`) ?? "404");

  if (!leyning)
    return (
      <ScrollView>
        <Text>No reading for date</Text>
      </ScrollView>
    );

  const aliyah = useMemo(
    () => leyning && getReading(leyning, params.aliyah),
    [leyning, params.aliyah],
  );

  if (!aliyah)
    return (
      <ScrollView>
        <Text>Bad aliyah number</Text>
      </ScrollView>
    );

  const verseInfo = useMemo(() => aliyah && aliyah.map(extractVerses), [aliyah]);

  const key = params.aliyah + leyning.name.en;

  const [audioSource, sofMismatch] = useMemo(() => {
    const sofMismatch = Array<boolean>(verseInfo.flat().length).fill(false);
    const arr = verseInfo.flat().map(({ book, chapterVerse, sof }, i) => {
      const src = audioMap[book]?.[fmtChV(chapterVerse!)]?.();
      if (!src) return null;
      const [pref, fallback] = sof ? [src.sof, src.reg] : [src.reg, src.sof];
      if (pref != null) return pref;
      sofMismatch[i] = true;
      return fallback;
    });
    return noneNull(arr) ? [arr, sofMismatch] : [null, null];
  }, [verseInfo]);
  const haveAudio = audioSource != null;

  const labelsPromise: Promise<number[][]> = useMemo(async () => {
    if (!haveAudio) return await Promise.race([]);
    return Promise.all(
      verseInfo.flat().map(({ book, chapterVerse }) =>
        // TODO: different labels for sof/reg
        getLabels(book).then((labels) => labels[fmtChV(chapterVerse!)]),
      ),
    );
  }, [verseInfo]);

  const book = usePromise<Book[]>(
    () => Promise.all(aliyah.map(({ k }) => getBook(k as BookName))),
    [key],
  );
  const transBook_ = usePromise<TransBook[]>(
    () => Promise.all(aliyah.map(({ k }) => getTransBook(k as BookName))),
    [key],
  );

  const transBook = translationOn ? transBook_ : undefined;

  let v_i = 0;
  const verses =
    book && transBook !== null
      ? verseInfo.flatMap((verses, i) =>
          verses.map((verse) => getVerseData(verse, book[i], transBook?.[i], sofMismatch?.[v_i++])),
        )
      : null;

  const tropes =
    params.aliyah === "H"
      ? "haftarah"
      : params.readingId.match(/Rosh Hashana|Yom Kippur/i)
      ? "hhd"
      : "torah";
  return (
    <PlayView
      audioLabels={labelsPromise}
      tikkun={tikkunOn}
      {...{ verses, tropes, audioSource, buttons, navigation }}
    />
  );
}

function noneNull<T>(arr: readonly T[]): arr is NonNullable<T>[] {
  return arr.every((v) => v != null);
}
const range = (n: number): null[] => Array(n).fill(null);

function slice<T>(arr: T[], start: number, end: number): T[] {
  if (start === 0 && end === arr.length) return arr;
  return arr.slice(start, end);
}

const extractVerses = (aliyah: Aliyah): Verse[] => {
  // these values are 0-indexed and **inclusive**
  const [begChapter, begVerse] = parseChV(aliyah.b);
  const [endChapter, endVerse] = parseChV(aliyah.e);
  const ret = numverses[aliyah.k as keyof typeof numverses].slice(1).flatMap((numV, cNum) => {
    if (cNum < begChapter || cNum > endChapter) return [];
    const verses = range(numV).map(
      (_, vNum): Verse => ({ book: aliyah.k as BookName, chapterVerse: [cNum, vNum], sof: false }),
    );
    const sliceStart = cNum === begChapter ? begVerse : 0;
    const sliceEnd = cNum === endChapter ? endVerse + 1 : verses.length;
    return slice(verses, sliceStart, sliceEnd);
  });
  ret[ret.length - 1].sof = true;
  return ret;
};

const getVerseData = (
  verse: Verse,
  book: Book,
  transBook?: TransBook,
  sofAudioMismatch = false,
): VerseData => {
  const [cNum, vNum] = verse.chapterVerse!;
  return {
    ...verse,
    words: book[cNum][vNum],
    translation: transBook?.text[cNum][vNum],
    sofAudioMismatch,
  };
};

type PlayViewProps = {
  verses: VerseInfo[] | null;
  audioSource: AVPlaybackSource[] | null;
  audioLabels: Promise<number[][]>;
  tikkun?: boolean;
  buttons?: React.ReactNode;
  navigation: NavigationProp;
  forceLinebreakVerses?: boolean;
  singleVerseAudio?: boolean;
  tropes?: "torah" | "haftarah" | "hhd";
};
export type Verse = {
  book: BookName;
  chapterVerse?: [number, number];
  sof: boolean;
};
export type VerseData = Verse & VerseInfo;
export type VerseInfo = {
  chapterVerse?: [number, number];
  words: string[];
  translation?: string;
  sofAudioMismatch?: boolean;
};
export function PlayView({
  verses,
  audioSource,
  audioLabels,
  tikkun = false,
  buttons,
  navigation,
  forceLinebreakVerses = false,
  singleVerseAudio = false,
  tropes,
}: PlayViewProps) {
  const navTheme = useNavigationTheme();
  const [{ textSize: textSizeMultiplier, audioSpeed }] = useSettings();

  const audio = useAudio(audioSource, { speed: audioSpeed });

  const labels = usePromise(() => audioLabels, [audioLabels]);

  const [fontsLoaded, err] = useFonts();
  if (err) console.error(err);

  const wordStyle = useMemo(
    () => getWordStyle(tikkun, textSizeMultiplier),
    [tikkun, textSizeMultiplier],
  );

  const changeAudioTime = useMemo(
    () =>
      audio && verses
        ? async (verseIndex: number, wordIndex: number) => {
            if (singleVerseAudio) {
              wordIndex += verses
                .slice(0, verseIndex)
                .reduce((a, { words }) => a + words.length, 0);
              verseIndex = 0;
            }
            const newTime = (await audioLabels)[verseIndex][wordIndex];
            audio.setCurrentTime(verseIndex, newTime);
          }
        : undefined,
    [audioLabels, verses, audio?.setCurrentTime],
  );

  const [modalVisible, setModalVisible] = useState(false);

  useScreenOptions(
    navigation,
    {
      headerRight: () => (
        <HeaderContainer>
          {tropes && (
            <CustomButton
              style={{ borderRadius: 100, margin: 0, padding: 8 }}
              onPress={() => {
                audio?.pause();
                navigation.navigate("TropeSelectScreen", { tropeType: tropes });
              }}
            >
              <TropeIcon fill={navTheme.colors.text} />
            </CustomButton>
          )}
          <Button title="Settings" onPress={() => setModalVisible(true)} />
        </HeaderContainer>
      ),
    },
    [tropes, setModalVisible, audio?.pause, navTheme],
  );

  if ((!fontsLoaded && !err) || !verses) {
    return (
      <View>
        <ActivityIndicator size="large" />
        <Text>Loading....</Text>
      </View>
    );
  } else {
    const unBitwiseNot = (x: number) => (x < 0 ? ~x : x);
    const audioInactive = audio == null || (!audio.playing && audio.currentTime == 0);
    let activeWordIndex =
      audioInactive || !labels
        ? null
        : unBitwiseNot(
            binarySearch(labels[audio.currentTrack], audio.currentTime, (a, b) =>
              a === b ? -1 : a - b,
            ),
          ) - 1;
    const activeVerseIndex =
      audioInactive || !labels
        ? null
        : singleVerseAudio
        ? activeWordIndex &&
          verses.findIndex((v) => {
            const ret = activeWordIndex! < v.words.length;
            if (!ret) activeWordIndex! -= v.words.length;
            return ret;
          })
        : audio.currentTrack;

    return (
      <View style={{ height: "100%" }}>
        <SettingsModal {...{ audio, modalVisible, setModalVisible }} />
        <ScrollView contentContainerStyle={{ paddingHorizontal: 5 }}>
          <Verses
            {...{
              verses,
              changeAudioTime,
              wordStyle,
              activeVerseIndex,
              activeWordIndex,
              forceLinebreakVerses,
            }}
          />
        </ScrollView>
        <Footer>
          {audio && changeAudioTime ? (
            <FooterButton
              onPress={() => {
                if (audioInactive) {
                  changeAudioTime(0, 0);
                } else {
                  if (audio.playing) audio.pause();
                  else audio.play();
                }
              }}
              buttonTitle={audio.loaded ? (audio.playing ? "Pause" : "Play") : "Audio loading..."}
              disabled={!audio.loaded}
            />
          ) : (
            <FooterButton buttonTitle="No audio for aliyah" disabled />
          )}
          {buttons}
        </Footer>
      </View>
    );
  }
}

function parseChV(s: string): [number, number] {
  const [ch, v] = s.split(":");
  return [parseInt(ch) - 1, parseInt(v) - 1];
}

type VersesProps = {
  verses: VerseInfo[];
  activeVerseIndex: number | null;
  activeWordIndex: number | null;
  forceLinebreakVerses: boolean;
  changeAudioTime: ChangeAudioTime | undefined;
  wordStyle: WordStyle;
};

const Verses = React.memo(function Verses({
  verses,
  activeVerseIndex,
  activeWordIndex,
  forceLinebreakVerses,
  changeAudioTime,
  wordStyle,
}: VersesProps) {
  let curWordIndex = 0;
  let anyTrans = false;
  const verseText = verses.map((verse, verseIndex) => {
    anyTrans ||= verse.translation != null;
    const key = verse.chapterVerse?.join(":") ?? verseIndex;
    const ret = (
      <Verse
        {...{ key, verse, verseIndex, changeAudioTime, wordStyle }}
        activeWordIndex={activeVerseIndex === verseIndex ? activeWordIndex : null}
      />
    );
    curWordIndex += verse.words.length;
    return ret;
  });

  return forceLinebreakVerses || anyTrans ? <View>{verseText}</View> : <Text>{verseText}</Text>;
});

export const getWordStyle = (tikkun: boolean, textSizeMultiplier: number) => {
  const deleteRegex = tikkun ? /[\/\u0591-\u05C7]/g : /[\/־]/g;
  const fontFamily = tikkun ? tikkunFont : hebFont;
  const fontMul = tikkun ? 30 : 36;
  return {
    deleteRegex,
    tikkun,
    style: {
      fontFamily,
      fontSize: fontMul * textSizeMultiplier,
    },
  };
};

type WordStyle = ReturnType<typeof getWordStyle>;

type VerseProps = {
  verse: VerseInfo;
  changeAudioTime: ChangeAudioTime | undefined;
  wordStyle: WordStyle;
  verseIndex: number;
  activeWordIndex: number | null;
};

const fmtChV = ([cNum, vNum]: [number, number]) => `${cNum + 1}:${vNum + 1}`;

const MAQAF = "־";

const Verse = React.memo(function Verse(props: VerseProps) {
  const { verse, changeAudioTime, wordStyle, verseIndex, activeWordIndex } = props;
  let prevMaqaf = false;
  const words = verse.words.map((word, wordIndex) => {
    const postMaqaf = prevMaqaf;
    prevMaqaf = word.endsWith(MAQAF);
    return (
      <Word
        key={wordIndex}
        {...{ word, verseIndex, wordIndex, wordStyle, changeAudioTime, postMaqaf }}
        active={wordIndex === activeWordIndex}
        // TODO: parse the trope somehow, maybe, to get it just on the mercha tipcha sof pasuk
        sofAudioMismatch={verse.sofAudioMismatch && verse.words.length - wordIndex <= 3}
      />
    );
  });

  const styles = useStyles();
  return (
    <>
      <Text style={[wordStyle.style, { userSelect: "none" }]}>
        <Text>{"\u200F"}</Text>
        {verse.chapterVerse && (
          <View style={styles.verseNumWrapper}>
            <RN.Text style={styles.verseNum}>{fmtChV(verse.chapterVerse)}</RN.Text>
          </View>
        )}
        {words}
      </Text>
      {verse.translation && <Text style={{ paddingHorizontal: 5 }}>{verse.translation}</Text>}
    </>
  );
});

type ChangeAudioTime = (verseIndex: number, wordIndex: number) => void;

type WordIndexInfo = Maybe<
  { verseIndex: number; wordIndex: number } & Maybe<{ changeAudioTime: ChangeAudioTime }>
>;

export type WordProps = WordIndexInfo & {
  wordStyle: WordStyle;
  word: string;
  active?: boolean;
  postMaqaf?: boolean;
  sofAudioMismatch?: boolean;
};

export function Word({
  word,
  wordStyle,
  active,
  verseIndex,
  wordIndex,
  changeAudioTime,
  postMaqaf = false,
  sofAudioMismatch = false,
}: WordProps) {
  const styles = useStyles();

  const maqaf = !wordStyle.tikkun && word.endsWith(MAQAF);
  const commonStyles = sofAudioMismatch && styles.sofAudioMismatch;
  return (
    <>
      <TouchableOpacity
        onPress={changeAudioTime && (() => changeAudioTime(verseIndex, wordIndex))}
        disabled={!changeAudioTime}
      >
        <RN.Text
          style={[
            commonStyles,
            styles.word,
            maqaf && styles.wordPreMaqaf,
            !wordStyle.tikkun && postMaqaf && styles.wordPostMaqaf,
            active && styles.active,
          ]}
        >
          {word.replace(wordStyle.deleteRegex, "")}
        </RN.Text>
      </TouchableOpacity>
      {maqaf && <Text style={commonStyles}>{MAQAF}</Text>}
    </>
  );
}
