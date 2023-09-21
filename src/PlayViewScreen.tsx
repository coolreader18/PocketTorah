import React, { useEffect, useMemo, useState } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Button,
  Modal,
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
import { usePromise } from "./utils";
import { useAudio } from "./useAudio";
import {
  AliyahNum,
  ScreenProps,
  getLeyning,
  Parshah,
  styles,
  FooterButton,
  CustomButton,
} from "./App";
import { useFonts } from "expo-font";

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
  const leyning = useMemo(() => getLeyning(params.readingId), [params.readingId]);
  const aliyah = getReading(leyning, params.aliyah);

  const key = params.aliyah + leyning.name.en;

  useEffect(() => {
    navigation.setOptions({ title: leyning.name.en });
  }, [navigation, key]);

  // in the files in data/, the maftir is in the 7th aliyah, so we need to
  // adjust for that with startingWordOffset
  const dataAliyahNum = params.aliyah === "M" ? "7" : params.aliyah;

  const parshah = leyning.parsha?.length == 1 ? (leyning.parsha[0] as Parshah) : null;

  const hebcalNum = params.aliyah == "H" ? "haftara" : params.aliyah;
  const haveAudio = parshah != null && (leyning.reason == null || !(hebcalNum in leyning.reason));
  const audio = useAudio(haveAudio ? audioMap[parshah][dataAliyahNum] : null);

  const startingWordOffset = haveAudio && params.aliyah === "M" ? maftirOffset[parshah] : 0;

  const labelsPromise: Promise<number[]> = useMemo(async () => {
    if (!haveAudio) return await Promise.race([]);
    const parshahBook = BOOK[lookupParsha(parshah).book] as TorahBookName;
    const { default: labels } = await labelsMap[parshahBook]();
    return (labels as any)[parshah]![dataAliyahNum];
  }, [key]);
  const labels = usePromise(() => labelsPromise, [key]);

  const book = usePromise<Book[]>(
    () => Promise.all(aliyah.map(({ k }) => bookMap[k as BookName]())),
    [key],
  );
  const transBook = usePromise<TransBook[]>(
    // ok micah
    () => Promise.all(aliyah.map(({ k }) => transBookMap[k as BookName]?.())),
    [key],
  );

  const [fontsLoaded] = useFonts(fonts);

  const [textSizeMultiplier, setTextSizeMultiplier] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);
  const [translationOn, setTranslationOn] = useState(false);
  const [tikkunOn, setTikkunOn] = useState(false);

  const wordStyle = useMemo(
    () => getWordStyle(tikkunOn, textSizeMultiplier),
    [tikkunOn, textSizeMultiplier],
  );

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ marginRight: 5 }}>
          <Button title="Settings" onPress={() => setModalVisible(true)} />
        </View>
      ),
    });
  }, [navigation]);

  const changeAudioTime = useMemo(
    () =>
      audio
        ? async (wordIndex: number) => {
            var newTime = (await labelsPromise)[wordIndex - startingWordOffset];
            audio.setCurrentTime(newTime);
          }
        : undefined,
    [labelsPromise, startingWordOffset, audio?.setCurrentTime],
  );

  if (!fontsLoaded || !book || (!translationOn && !transBook)) {
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
      <View style={{ flex: 1, maxHeight: "100%" }}>
        <Modal
          animationType={"slide"}
          transparent={false}
          visible={modalVisible}
          onRequestClose={() => console.log("Modal has been closed.")}
        >
          <PlaySettings
            textSizeMultiplier={textSizeMultiplier}
            setTextSizeMultiplier={setTextSizeMultiplier}
            audioSpeed={audio?.speed}
            setAudioSpeed={audio?.setSpeed}
            closeSettings={() => setModalVisible(false)}
          />
        </Modal>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 5 }}>
          <Verses
            changeAudioTime={changeAudioTime}
            wordStyle={wordStyle}
            activeWordIndex={activeWordIndex}
            book={book}
            transBook={translationOn ? transBook : null}
            aliyah={aliyah}
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
          <FooterButton
            onPress={() => setTranslationOn((b) => !b)}
            buttonTitle={translationOn ? "Translation Off" : "Translation On"}
          />
          <FooterButton
            onPress={() => setTikkunOn((b) => !b)}
            buttonTitle={tikkunOn ? "Tikkun Off" : "Tikkun On"}
          />
        </View>
      </View>
    );
  }
}

type PlaySettingsProps = {
  textSizeMultiplier: number;
  setTextSizeMultiplier: (v: number) => void;
  audioSpeed?: number;
  setAudioSpeed?: (v: number) => void;
  closeSettings: () => void;
};

function PlaySettings({
  textSizeMultiplier,
  setTextSizeMultiplier,
  audioSpeed,
  setAudioSpeed,
  closeSettings,
}: PlaySettingsProps) {
  const [settingsTextSize, setSettingsTextSize] = useState(textSizeMultiplier);
  const [savedAudioSpeed, setSavedAudioSpeed] = useState(audioSpeed ?? 1);

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
            value={settingsTextSize}
            onValueChange={setSettingsTextSize}
          />
          <Word word={breishit} wordStyle={getWordStyle(false, settingsTextSize)} />
          <Word word={breishit} wordStyle={getWordStyle(true, settingsTextSize)} />
        </View>
        {audioSpeed != null && setAudioSpeed != null && (
          <View style={styles.modalSection}>
            <Text>Set Audio Speed:</Text>
            <Slider
              minimumValue={0.5}
              maximumValue={2}
              value={audioSpeed}
              onValueChange={setAudioSpeed}
            />
          </View>
        )}

        <View style={styles.modalFooter}>
          <CustomButton
            onPress={() => {
              if (audioSpeed != null) setSavedAudioSpeed(audioSpeed);
              setTextSizeMultiplier(settingsTextSize);
              closeSettings();
            }}
            buttonTitle="Save Settings"
          />
          <CustomButton
            onPress={() => {
              if (setAudioSpeed) setAudioSpeed(savedAudioSpeed);
              setSettingsTextSize(textSizeMultiplier);
              closeSettings();
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
  aliyah: Aliyah[];
  book: Book[];
  transBook: TransBook[] | null;
  activeWordIndex: number | null;
  changeAudioTime: ((wordIndex: number) => void) | undefined;
  wordStyle: WordStyle;
};

const Verses = React.memo(function Verses(props: VersesProps) {
  const { aliyah, book, transBook, activeWordIndex } = props;
  const verseText: React.JSX.Element[] = [];
  aliyah.forEach((aliyah, i) => {
    const b = book[i].Tanach.tanach.book;
    let lastWordIndex = 0;
    const [endChapter, endVerse] = parseChV(aliyah.e);
    for (
      let [curChapter, curVerse] = parseChV(aliyah.b);
      curChapter <= endChapter && curVerse <= endVerse;
      curVerse++
    ) {
      const verse = b.c[curChapter]!.v[curVerse];
      if (verse == null) {
        curChapter = curChapter + 1;
        curVerse = 0;
        continue;
      }
      const nextWordIndex = lastWordIndex + verse.w.length;
      verseText.push(
        <Verse
          {...props}
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
          chapterIndex={curChapter}
          verseIndex={curVerse}
          key={`${curChapter}:${curVerse}`}
        />,
      );
      if (transBook) {
        verseText.push(
          <Text key={`translation${curChapter}:${curVerse}`} style={{ paddingHorizontal: 5 }}>
            {transBook[i]?.text[curChapter][curVerse]}
          </Text>,
        );
      }

      lastWordIndex += verse.w.length;
    }
  });

  return transBook ? <View>{verseText}</View> : <Text>{verseText}</Text>;
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
  changeAudioTime: ((wordIndex: number) => void) | undefined;
  wordStyle: WordStyle;
  curWordIndex: number;
  chapterIndex: number;
  verseIndex: number;
  verse: NonNullable<Book["Tanach"]["tanach"]["book"]["c"][0]>["v"][0];
  activeWordIndex: number | null;
};

const Verse = React.memo(function Verse(props: VerseProps) {
  const {
    changeAudioTime,
    wordStyle,
    curWordIndex,
    chapterIndex,
    verseIndex,
    verse,
    activeWordIndex,
  } = props;
  var words = verse.w.map((word, i) => {
    const wordIndex = curWordIndex + i;
    return (
      <Word
        key={wordIndex}
        wordIndex={wordIndex}
        active={wordIndex === activeWordIndex}
        verseNum={i === 0 ? `${chapterIndex + 1}:${verseIndex + 1}` : undefined}
        word={word as string}
        wordStyle={wordStyle}
        changeAudioTime={changeAudioTime}
      />
    );
  });

  return (
    <Text>
      <Text key="rtl">{"\u200F"}</Text>
      {words}
    </Text>
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
