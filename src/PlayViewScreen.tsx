import React, { useEffect, useMemo, useState } from "react";
import {
  Text,
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
import { lookupParsha, BOOK, Leyning, Aliyah } from "@hebcal/leyning";
import {
  audio as audioMap,
  labels as labelsMap,
  bookMap,
  transBookMap,
  fonts,
} from "./assetImports";
import binarySearch from "binary-search";
import { usePromise, useScreenOptions, useScreenTitle } from "./utils";
import { useAudio } from "./useAudio";
import {
  AliyahNum,
  ScreenProps,
  getLeyning,
  Parshah,
  styles,
  FooterButton,
  CustomButton,
  fixReadingId,
  NavigationProp,
} from "./App";
import { useFonts } from "expo-font";
import { UpdateSettings, useSettings } from "./settings";
import { AVPlaybackSource } from "expo-av";

type ImportType<T extends { [k: string]: () => Promise<{ default: any }> }> =
  ImportMap<T>[keyof ImportMap<T>];
type ImportMap<T extends { [k: string]: () => Promise<{ default: any }> }> = {
  [k in keyof T]: Awaited<ReturnType<T[k]>>["default"];
};

type TorahBookName = keyof typeof labelsMap;
type BookName = keyof typeof transBookMap;

const getReading = (leyning: Leyning, num: AliyahNum) => {
  const aliyah = num === "H" ? leyning.haft : (leyning.fullkriyah ?? leyning.weekday!)[num];
  return Array.isArray(aliyah) ? aliyah : [aliyah];
};

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
  const [{ il }] = useSettings();
  const leyning = useMemo(() => getLeyning(readingId, il), [readingId, il]);
  const aliyah = getReading(leyning, params.aliyah);

  const key = params.aliyah + leyning.name.en;

  useScreenTitle(navigation, leyning.name.en);

  // in the files in data/, the maftir is in the 7th aliyah, so we need to
  // adjust for that with startingWordOffset
  const dataAliyahNum = params.aliyah === "M" ? "7" : params.aliyah;

  const parshah = leyning.parsha?.length == 1 ? (leyning.parsha[0] as Parshah) : null;

  const hebcalNum = params.aliyah == "H" ? "haftara" : params.aliyah;
  const haveAudio = parshah != null && (leyning.reason == null || !(hebcalNum in leyning.reason));
  const audioSource = haveAudio ? audioMap[parshah][dataAliyahNum] : null;

  const startingWordOffset = haveAudio && params.aliyah === "M" ? maftirOffset[parshah] : 0;

  const labelsPromise: Promise<number[]> = useMemo(async () => {
    if (!haveAudio) return await Promise.race([]);
    const parshahBook = BOOK[lookupParsha(parshah).book] as TorahBookName;
    const { default: labels } = await labelsMap[parshahBook]();
    return (labels as any)[parshah]![dataAliyahNum];
  }, [key]);

  const book = usePromise<Book[]>(
    () => Promise.all(aliyah.map(({ k }) => bookMap[k as BookName]())),
    [key],
  );
  const transBook_ = usePromise<TransBook[]>(
    () => Promise.all(aliyah.map(({ k }) => transBookMap[k as BookName]())),
    [key],
  );

  const transBook = translationOn ? transBook_ : undefined;

  const verses = book && transBook !== null ? extractVerseData(aliyah, book, transBook) : null;

  return (
    <PlayView
      verses={verses}
      startingWordOffset={startingWordOffset}
      audioSource={audioSource}
      audioLabels={labelsPromise}
      tikkun={tikkunOn}
      buttons={buttons}
      navigation={navigation}
    />
  );
}
const extractVerseData = (aliyah: Aliyah[], book: Book[], transBook?: TransBook[]): VerseData[] =>
  aliyah.flatMap((aliyah, i) => {
    const b = book[i].Tanach.tanach.book;
    const [begChapter, begVerse] = parseChV(aliyah.b);
    const [endChapter, endVerse] = parseChV(aliyah.e);
    return b.c
      .map((c, cNum) => {
        if (c == null) return [];
        const verses = c!.v.map(
          (v, vNum): VerseData => ({
            chapterVerse: [cNum, vNum],
            words: v.w as string[],
            translation: transBook && transBook[i]?.text[cNum][vNum],
          }),
        );
        if (cNum === begChapter) return verses.slice(begVerse);
        else if (cNum === endChapter) return verses.slice(0, endVerse + 1);
        else return verses;
      })
      .slice(begChapter, endChapter + 1)
      .flat();
  });

type PlayViewProps = {
  verses: VerseData[] | null;
  audioSource: AVPlaybackSource | null;
  audioLabels: Promise<number[]>;
  tikkun?: boolean;
  buttons?: React.ReactNode;
  startingWordOffset?: number;
  navigation: NavigationProp;
};
export type VerseData = {
  chapterVerse?: [number, number];
  words: string[];
  translation?: string;
};
export function PlayView({
  verses,
  audioSource,
  audioLabels,
  tikkun = false,
  buttons,
  startingWordOffset = 0,
  navigation,
}: PlayViewProps) {
  const [{ textSize: textSizeMultiplier, audioSpeed }] = useSettings();

  const audio = useAudio(audioSource, { speed: audioSpeed });

  const labels = usePromise(() => audioLabels, [audioLabels]);

  const [fontsLoaded] = useFonts(fonts);

  const [modalVisible, setModalVisible] = useState(false);

  const wordStyle = useMemo(
    () => getWordStyle(tikkun, textSizeMultiplier),
    [tikkun, textSizeMultiplier],
  );

  useScreenOptions(navigation, {
    headerRight: () => (
      <View style={{ marginRight: 5 }}>
        <Button title="Settings" onPress={() => setModalVisible(true)} />
      </View>
    ),
  });

  const changeAudioTime = useMemo(
    () =>
      audio
        ? async (wordIndex: number) => {
            var newTime = (await audioLabels)[wordIndex - startingWordOffset];
            audio.setCurrentTime(newTime);
          }
        : undefined,
    [audioLabels, startingWordOffset, audio?.setCurrentTime],
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
    const activeWordIndex =
      audioInactive || !labels
        ? null
        : unBitwiseNot(binarySearch(labels, audio.currentTime, (a, b) => (a === b ? -1 : a - b))) -
          1 -
          startingWordOffset;

    return (
      <View style={{ height: "100%" }}>
        <Modal
          animationType={"slide"}
          transparent={false}
          visible={modalVisible}
          onRequestClose={() => console.log("Modal has been closed.")}
        >
          <PlaySettings
            closeSettings={() => setModalVisible(false)}
            setAudioSpeed={audio?.setSpeed}
          />
        </Modal>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 5 }}>
          <Verses
            verses={verses}
            changeAudioTime={changeAudioTime}
            wordStyle={wordStyle}
            activeWordIndex={activeWordIndex}
          />
        </ScrollView>
        <View style={styles.footer}>
          {audio && changeAudioTime ? (
            <FooterButton
              onPress={() => {
                if (audioInactive) {
                  changeAudioTime(0);
                } else {
                  audio.toggle();
                }
              }}
              buttonTitle={audio.loaded ? (audio.playing ? "Pause" : "Play") : "Audio loading..."}
              disabled={!audio.loaded}
            />
          ) : (
            <FooterButton buttonTitle="No audio for aliyah" disabled={true} />
          )}
          {buttons}
        </View>
      </View>
    );
  }
}

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

  const breishit = "בְּרֵאשִׁ֖ית";
  return (
    <View style={{ marginTop: 22 }}>
      <View>
        <Text style={styles.modalHeader}>Settings</Text>
        <View style={styles.modalSection}>
          <Text>Font Size:</Text>
          <Slider
            minimumValue={0.5}
            maximumValue={2}
            value={tempSettings.textSize}
            onValueChange={(textSize) => updateTempSettings({ textSize })}
          />
          <Word word={breishit} wordStyle={getWordStyle(false, tempSettings.textSize)} />
          <Word word={breishit} wordStyle={getWordStyle(true, tempSettings.textSize)} />
        </View>
        {setAudioSpeed && (
          <View style={styles.modalSection}>
            <Text>Set Audio Speed:</Text>
            <Slider
              minimumValue={0.5}
              maximumValue={2}
              value={tempSettings.audioSpeed}
              onSlidingComplete={(audioSpeed) => updateTempSettings({ audioSpeed })}
            />
          </View>
        )}

        <View
          style={[styles.modalSection, { flexDirection: "row", justifyContent: "space-between" }]}
        >
          <Text>Israeli Holiday Scheme?</Text>
          <Switch value={tempSettings.il} onValueChange={(il) => updateTempSettings({ il })} />
        </View>

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
      </View>
    </View>
  );
}

function parseChV(s: string): [number, number] {
  const [ch, v] = s.split(":");
  return [parseInt(ch) - 1, parseInt(v) - 1];
}

type Book = ImportType<typeof bookMap>;
type TransBook = ImportType<typeof transBookMap>;

type VersesProps = {
  verses: VerseData[];
  activeWordIndex: number | null;
  changeAudioTime: ((wordIndex: number) => void) | undefined;
  wordStyle: WordStyle;
};

const Verses = React.memo(function Verses(props: VersesProps) {
  const { verses, activeWordIndex } = props;
  let lastWordIndex = 0;
  let anyTrans = false;
  const verseText = verses.map((verse, i) => {
    anyTrans ||= verse.translation != null;
    const nextWordIndex = lastWordIndex + verse.words.length;
    const key = verse.chapterVerse?.join(":") ?? i;
    const ret = (
      <Verse
        {...props}
        key={key}
        verse={verse}
        curWordIndex={lastWordIndex}
        // let React.memo work its magic when this Verse doesn't have the active word anyway
        activeWordIndex={
          activeWordIndex == null
            ? null
            : lastWordIndex <= activeWordIndex && activeWordIndex < nextWordIndex
            ? activeWordIndex
            : null
        }
      />
    );
    lastWordIndex = nextWordIndex;
    return ret;
  });

  return anyTrans ? <View>{verseText}</View> : <Text>{verseText}</Text>;
});

const getWordStyle = (tikkun: boolean, textSizeMultiplier: number) =>
  ({
    deleteRegex: tikkun ? /[\/\u0591-\u05C7]/g : /\//g,
    style: [
      tikkun ? styles.stam : styles.word,
      { fontSize: (tikkun ? 30 : 36) * textSizeMultiplier },
    ],
  }) as const;

type WordStyle = ReturnType<typeof getWordStyle>;

type VerseProps = {
  verse: VerseData;
  changeAudioTime: ((wordIndex: number) => void) | undefined;
  wordStyle: WordStyle;
  curWordIndex: number;
  activeWordIndex: number | null;
};

const Verse = React.memo(function Verse(props: VerseProps) {
  const { verse, changeAudioTime, wordStyle, curWordIndex, activeWordIndex } = props;
  var words = verse.words.map((word, i) => {
    const wordIndex = curWordIndex + i;
    return (
      <Word
        key={wordIndex}
        wordIndex={wordIndex}
        active={wordIndex === activeWordIndex}
        verseNum={
          i === 0 && verse.chapterVerse
            ? `${verse.chapterVerse[0] + 1}:${verse.chapterVerse[1] + 1}`
            : undefined
        }
        word={word as string}
        wordStyle={wordStyle}
        changeAudioTime={changeAudioTime}
      />
    );
  });

  return (
    <>
      <Text>
        <Text key="rtl">{"\u200F"}</Text>
        {words}
      </Text>
      {verse.translation && <Text style={{ paddingHorizontal: 5 }}>{verse.translation}</Text>}
    </>
  );
});

type Maybe<T> = T | { [k in keyof T]?: never };
type MaybeAnd<T, U> = (Maybe<T> & { [k in keyof U]?: never }) | (T & Maybe<U>);

type WordIndexInfo = MaybeAnd<
  { wordIndex: number },
  { changeAudioTime: (wordIndex: number) => void }
>;

type WordProps = WordIndexInfo & {
  wordStyle: WordStyle;
  word: string;
  verseNum?: string;
  active?: boolean;
};

function Word({ word, wordStyle, verseNum, active, wordIndex, changeAudioTime }: WordProps) {
  const wordElem = (
    <Text style={[wordStyle.style, active && styles.active]}>
      {word.replace(wordStyle.deleteRegex, "")}
    </Text>
  );
  return (
    <TouchableOpacity
      onPress={changeAudioTime && (() => changeAudioTime(wordIndex))}
      disabled={!changeAudioTime}
    >
      {verseNum ? (
        <Text style={wordStyle.style[0]}>
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
