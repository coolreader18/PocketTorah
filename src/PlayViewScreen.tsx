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
import { useAudio } from "./useAudio";
import { AliyahNum, ScreenProps, Parshah, NavigationProp } from "./App";
import { getLeyning, fixReadingId, Reading } from "./leyning";
import { Footer, FooterButton, ModalSection, Text, useStyles, wrapComponent } from "./theming";
import { CustomButton } from "./theming";
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

  const aliyah = getReading(leyning, params.aliyah);

  const key = params.aliyah + leyning.name.en;

  // in the files in data/, the maftir is in the 7th aliyah, so we need to
  // adjust for that with startingWordOffset
  const dataAliyahNum = params.aliyah === "M" ? "7" : params.aliyah;

  const parshah = leyning.parsha?.length == 1 ? (leyning.parsha[0] as Parshah) : null;

  const haveAudio = parshah != null && !aliyah.some((aliyah) => "reason" in aliyah) && !tri;
  const audioSource = haveAudio ? audioMap[parshah][dataAliyahNum] : null;

  const startingWordOffset =
    haveAudio && params.aliyah === "M" && parshah != "Vezot Haberakhah" ? maftirOffset[parshah] : 0;

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
      audioLabels={labelsPromise}
      tikkun={tikkunOn}
      {...{ verses, startingWordOffset, audioSource, buttons, navigation }}
    />
  );
}
const extractVerseData = (aliyah: Aliyah[], book: Book[], transBook?: TransBook[]): VerseData[] =>
  aliyah.flatMap((aliyah, i) => {
    const b = book[i].Tanach.tanach.book;
    // these values are 0-indexed and **inclusive**
    const [begChapter, begVerse] = parseChV(aliyah.b);
    const [endChapter, endVerse] = parseChV(aliyah.e);
    return b.c.flatMap((c, cNum) => {
      if (cNum < begChapter || cNum > endChapter) return [];
      const verses = c!.v.map(
        (v, vNum): VerseData => ({
          chapterVerse: [cNum, vNum],
          words: v.w as string[],
          translation: transBook && transBook[i]?.text[cNum][vNum],
        }),
      );
      const sliceStart = cNum === begChapter ? begVerse : 0;
      const sliceEnd = cNum === endChapter ? endVerse + 1 : verses.length;
      return sliceStart === 0 && sliceEnd === verses.length
        ? verses
        : verses.slice(sliceStart, sliceEnd);
    });
  });

type PlayViewProps = {
  verses: VerseData[] | null;
  audioSource: AVPlaybackSource | null;
  audioLabels: Promise<number[]>;
  tikkun?: boolean;
  buttons?: React.ReactNode;
  startingWordOffset?: number;
  navigation: NavigationProp;
  forceLinebreakVerses?: boolean;
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
  forceLinebreakVerses = false,
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
            const newTime = (await audioLabels)[wordIndex - startingWordOffset];
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
          animationType="slide"
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
            {...{ verses, changeAudioTime, wordStyle, activeWordIndex, forceLinebreakVerses }}
          />
        </ScrollView>
        <Footer>
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
            <FooterButton buttonTitle="No audio for aliyah" disabled />
          )}
          {buttons}
        </Footer>
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
  activeWordIndex: number | null;
  forceLinebreakVerses: boolean;
  changeAudioTime: ((wordIndex: number) => void) | undefined;
  wordStyle: WordStyle;
};

const Verses = React.memo(function Verses({
  verses,
  activeWordIndex,
  forceLinebreakVerses,
  changeAudioTime,
  wordStyle,
}: VersesProps) {
  let curWordIndex = 0;
  let anyTrans = false;
  const verseText = verses.map((verse, i) => {
    anyTrans ||= verse.translation != null;
    const nextWordIndex = curWordIndex + verse.words.length;
    const key = verse.chapterVerse?.join(":") ?? i;
    const verseActive =
      activeWordIndex != null && curWordIndex <= activeWordIndex && activeWordIndex < nextWordIndex;
    const ret = (
      <Verse
        {...{ key, verse, curWordIndex, changeAudioTime, wordStyle }}
        // let React.memo work its magic when this Verse doesn't have the active word anyway
        activeWordIndex={verseActive ? activeWordIndex : null}
      />
    );
    curWordIndex = nextWordIndex;
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
    style: {
      fontFamily,
      fontSize: fontMul * textSizeMultiplier,
    },
  };
};

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
  const words = verse.words.map((word, i) => {
    const wordIndex = curWordIndex + i;
    return (
      <Word
        key={wordIndex}
        {...{ word, wordIndex, wordStyle, changeAudioTime }}
        active={wordIndex === activeWordIndex}
        verseNum={
          i === 0 && verse.chapterVerse
            ? `${verse.chapterVerse[0] + 1}:${verse.chapterVerse[1] + 1}`
            : undefined
        }
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

type WordIndexInfo = Maybe<
  { wordIndex: number } & Maybe<{ changeAudioTime: (wordIndex: number) => void }>
>;

type WordProps = WordIndexInfo & {
  wordStyle: WordStyle;
  word: string;
  verseNum?: string;
  active?: boolean;
};

function Word({ word, wordStyle, verseNum, active, wordIndex, changeAudioTime }: WordProps) {
  const styles = useStyles();

  const wordElem = (
    <Text style={[styles.word, wordStyle.style, active && styles.active]}>
      {word.replace(wordStyle.deleteRegex, "")}
    </Text>
  );
  return (
    <TouchableOpacity
      onPress={changeAudioTime && (() => changeAudioTime(wordIndex))}
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
