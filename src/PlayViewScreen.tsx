import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Button,
  Modal,
  Switch,
} from "react-native";
import Slider from "@react-native-community/slider";
import maftirOffset from "../data/maftirOffset.json";
import { lookupParsha, BOOK, Aliyah } from "@hebcal/leyning";
import {
  audio as audioMap,
  labels as labelsMap,
  bookMap,
  transBookMap,
  fonts,
  tikkunFont,
  hebFont,
} from "./assetImports";
import binarySearch from "binary-search";
import { Maybe, ensureArray, usePromise, useScreenOptions, useScreenTitle } from "./utils";
import { Audio, useAudio } from "./useAudio";
import { AliyahNum, ScreenProps, Parshah, NavigationProp } from "./App";
import { getLeyning, fixReadingId, Reading } from "./leyning";
import { Footer, FooterButton, ModalSection, Text, useStyles, wrapComponent } from "./theming";
import { CustomButton } from "./theming";
import { useFonts } from "expo-font";
import { UpdateSettings, useSettings } from "./settings";
import { AVPlaybackSource } from "expo-av";
import { numverses } from "./numVerses";

type ImportType<T extends { [k: string]: () => Promise<{ default: any }> }> =
  ImportMap<T>[keyof ImportMap<T>];
type ImportMap<T extends { [k: string]: () => Promise<{ default: any }> }> = {
  [k in keyof T]: Awaited<ReturnType<T[k]>>["default"];
};

export type BookName = keyof typeof audioMap;

const getReading = (leyning: Reading, num: AliyahNum) =>
  ensureArray(num === "H" ? leyning.haftara : leyning.aliyot[num]);

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
  const [{ tri, il }] = useSettings();
  const leyning = useMemo(() => getLeyning(readingId, { tri, il }), [readingId, tri, il]);

  useScreenTitle(navigation, leyning?.name.en ?? "404");

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

  const verseInfo = useMemo(() => aliyah && aliyah.map(extractVerses), [aliyah]);

  const key = params.aliyah + leyning.name.en;

  const audioSource: AVPlaybackSource[] | null = useMemo(() => {
    const arr = verseInfo.flat().map(({ book, chapterVerse, sof }) => {
      const src = audioMap[book][fmtChV(chapterVerse!)]?.();
      return src && (sof ? src.sof ?? src.reg : src.reg ?? src.sof);
    });
    return arr.some((v) => v == null) ? null : (arr as AVPlaybackSource[]);
  }, [verseInfo]);
  const haveAudio = audioSource != null;

  const labelsPromise: Promise<number[][]> = useMemo(async () => {
    if (!haveAudio) return await Promise.race([]);
    return Promise.all(
      verseInfo.flat().map(({ book, chapterVerse }) =>
        // TODO: different labels for sof/reg
        labelsMap[book]().then(
          ({ default: labels }) => (labels as Record<string, number[]>)[fmtChV(chapterVerse!)],
        ),
      ),
    );
  }, [verseInfo]);

  const book = usePromise<Book[]>(
    () => Promise.all(aliyah.map(({ k }) => bookMap[k as BookName]())),
    [key],
  );
  const transBook_ = usePromise<TransBook[]>(
    () => Promise.all(aliyah.map(({ k }) => transBookMap[k as BookName]())),
    [key],
  );

  const transBook = translationOn ? transBook_ : undefined;

  const verses =
    book && transBook !== null
      ? verseInfo.flatMap((verse, i) => getVerseData(verse, book[i], transBook?.[i]))
      : null;

  return (
    <PlayView
      audioLabels={labelsPromise}
      tikkun={tikkunOn}
      {...{ verses, audioSource, buttons, navigation }}
    />
  );
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

const getVerseData = (verses: Verse[], book: Book, transBook?: TransBook): VerseData[] =>
  verses.map((v) => {
    const [cNum, vNum] = v.chapterVerse!;
    return {
      ...v,
      words: book[cNum][vNum],
      translation: transBook?.text[cNum][vNum],
    };
  });

type PlayViewProps = {
  verses: VerseData[] | null;
  audioSource: AVPlaybackSource[] | null;
  audioLabels: Promise<number[][]>;
  tikkun?: boolean;
  buttons?: React.ReactNode;
  navigation: NavigationProp;
  forceLinebreakVerses?: boolean;
  singleVerseAudio?: boolean;
};
export type Verse = {
  book: BookName;
  chapterVerse?: [number, number];
  sof: boolean;
};
export type VerseData = Verse & {
  words: string[];
  translation?: string;
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
}: PlayViewProps) {
  const [{ textSize: textSizeMultiplier, audioSpeed }] = useSettings();

  const audio = useAudio(audioSource, { speed: audioSpeed });

  const labels = usePromise(() => audioLabels, [audioLabels]);

  const [fontsLoaded] = useFonts(fonts);

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

  if (!fontsLoaded || !verses) {
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
        <SettingsModal {...{ navigation, audio }} />
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

export const SettingsModal = ({
  navigation,
  audio,
}: {
  navigation: NavigationProp;
  audio: Audio | null;
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  useScreenOptions(navigation, {
    headerRight: () => (
      <View style={{ marginRight: 5 }}>
        <Button title="Settings" onPress={() => setModalVisible(true)} />
      </View>
    ),
  });

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={modalVisible}
      onRequestClose={() => console.log("Modal has been closed.")}
    >
      <PlaySettings closeSettings={() => setModalVisible(false)} setAudioSpeed={audio?.setSpeed} />
    </Modal>
  );
};

type PlaySettingsProps = {
  closeSettings: () => void;
  setAudioSpeed?: (speed: number) => void;
};

export function PlaySettings({ closeSettings, setAudioSpeed }: PlaySettingsProps) {
  const [settings, updateSettings] = useSettings();
  const [tempSettings, setTempSettings] = useState(settings);
  const updateTempSettings: UpdateSettings = (upd) =>
    setTempSettings((prev) => ({ ...prev, ...upd }));

  useEffect(() => {
    setAudioSpeed?.(tempSettings.audioSpeed);
  }, [setAudioSpeed, tempSettings.audioSpeed]);

  const styles = useStyles();

  const breishit = "בְּרֵאשִׁ֖ית";
  return (
    <View style={[styles.modalContainer, { height: "100%" }, styles.baseBackground]}>
      <Text style={styles.modalHeader}>Settings</Text>
      <ModalSection>
        <Text>Font Size:</Text>
        <Slider
          minimumValue={0.5}
          maximumValue={2}
          value={tempSettings.textSize}
          onValueChange={(textSize) => updateTempSettings({ textSize })}
        />
        <Word word={breishit} wordStyle={getWordStyle(false, tempSettings.textSize)} />
        <Word word={breishit} wordStyle={getWordStyle(true, tempSettings.textSize)} />
      </ModalSection>
      {setAudioSpeed && (
        <ModalSection>
          <Text>Set Audio Speed:</Text>
          <Slider
            minimumValue={0.5}
            maximumValue={2}
            value={tempSettings.audioSpeed}
            onSlidingComplete={(audioSpeed) => updateTempSettings({ audioSpeed })}
          />
        </ModalSection>
      )}

      <ModalSection>
        <SettingsRow>
          <Text>Triennial?</Text>
          <Switch value={tempSettings.tri} onValueChange={(tri) => updateTempSettings({ tri })} />
        </SettingsRow>
        <SettingsRow>
          <Text>Israeli Holiday Scheme?</Text>
          <Switch value={tempSettings.il} onValueChange={(il) => updateTempSettings({ il })} />
        </SettingsRow>
      </ModalSection>

      <View style={styles.modalFooter}>
        <CustomButton
          onPress={() => {
            updateSettings(tempSettings);
            closeSettings();
          }}
          buttonTitle="Save Settings"
        />
        <CustomButton
          onPress={() => {
            closeSettings();
            setAudioSpeed?.(settings.audioSpeed);
          }}
          buttonTitle="Cancel"
        />
      </View>

      <ModalSection>
        <SettingsRow>
          <Text>Color Scheme</Text>
          <View style={{ flexDirection: "row" }}>
            {(["auto", "light", "dark"] as const).map((colorTheme) => (
              <TouchableOpacity key={colorTheme} onPress={() => updateSettings({ colorTheme })}>
                <Text style={[{ padding: 4 }, settings.colorTheme === colorTheme && styles.active]}>
                  {titlecase(colorTheme)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SettingsRow>
      </ModalSection>
    </View>
  );
}

const SettingsRow = wrapComponent(View, "settingsRow");
const titlecase = (s: string) => s.slice(0, 1).toUpperCase() + s.slice(1);

function parseChV(s: string): [number, number] {
  const [ch, v] = s.split(":");
  return [parseInt(ch) - 1, parseInt(v) - 1];
}

type Book = ImportType<typeof bookMap>;
type TransBook = ImportType<typeof transBookMap>;

type VersesProps = {
  verses: VerseData[];
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

const getWordStyle = (tikkun: boolean, textSizeMultiplier: number) => {
  const deleteRegex = tikkun ? /[\/\u0591-\u05C7]/g : /\//g;
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
  verse: VerseData;
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
        verseNum={wordIndex === 0 && verse.chapterVerse ? fmtChV(verse.chapterVerse) : undefined}
      />
    );
  });

  return (
    <>
      <Text>
        <Text>{"\u200F"}</Text>
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

type WordProps = WordIndexInfo & {
  wordStyle: WordStyle;
  word: string;
  verseNum?: string;
  active?: boolean;
  postMaqaf?: boolean;
};

function Word({
  word,
  wordStyle,
  verseNum,
  active,
  verseIndex,
  wordIndex,
  changeAudioTime,
  postMaqaf = false,
}: WordProps) {
  const styles = useStyles();

  const wordElem = (
    <Text
      style={[
        styles.word,
        !wordStyle.tikkun && word.endsWith(MAQAF) && styles.wordMaqaf,
        !wordStyle.tikkun && postMaqaf && styles.wordPostMaqaf,
        wordStyle.style,
        active && styles.active,
      ]}
    >
      {word.replace(wordStyle.deleteRegex, "")}
    </Text>
  );
  return (
    <TouchableOpacity
      onPress={changeAudioTime && (() => changeAudioTime(verseIndex, wordIndex))}
      disabled={!changeAudioTime}
    >
      {verseNum ? (
        <Text style={{ fontFamily: wordStyle.style.fontFamily }}>
          <View style={styles.verseNumWrapper}>
            <Text style={styles.verseNum}>{verseNum}</Text>
          </View>
          {wordElem}
        </Text>
      ) : (
        wordElem
      )}
    </TouchableOpacity>
  );
}
