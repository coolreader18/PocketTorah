/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Button,
  Modal,
  TextStyle,
  ViewStyle,
} from "react-native";
import Slider from "@react-native-community/slider";

import { NavigationContainer } from "@react-navigation/native";
import {
  StackNavigationProp,
  StackScreenProps,
  createStackNavigator,
} from "@react-navigation/stack";

import maftirOffset from "../data/maftirOffset.json";
import { HDate, parshiot as hebcalParshiot } from "@hebcal/core";
import {
  getLeyningOnDate,
  getLeyningForParsha,
  formatAliyahShort,
  parshiyot,
  BOOK,
  Leyning,
  Aliyah,
} from "@hebcal/leyning";

import { audio as audioMap, labels as labelsMap, bookMap, transBookMap } from "./assetImports";

import binarySearch from "binary-search";
import { platformSelect, usePromise } from "./utils";
import { useAudio } from "./useAudio";

type CustomButtonProps = {
  onPress?: () => void;
  style?: object;
  buttonTitle: string;
  disabled?: boolean;
};

function CustomButton({ onPress, style, buttonTitle, disabled }: CustomButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} style={style} disabled={disabled}>
      <Text style={styles.button}>{buttonTitle}</Text>
    </TouchableOpacity>
  );
}

function FooterButton({ onPress, style, buttonTitle, disabled }: CustomButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.footerButton, disabled && { opacity: 0.5 }, style]}
      disabled={disabled}
    >
      <Text style={styles.footerButtonInner}>{buttonTitle}</Text>
    </TouchableOpacity>
  );
}

function HomeScreen({ navigation }: ScreenProps<"Home">) {
  const { navigate } = navigation;

  return (
    <ScrollView>
      <CustomButton
        onPress={() => navigate("TorahReadingsScreen")}
        buttonTitle="List of Torah Readings"
      />
      <CustomButton
        onPress={() => {
          const hdate = new HDate();
          // const hdate = new HDate(28, "elul", 5783);
          // const hdate = new HDate(28, 'Tamuz', 5795);
          // const hdate = new HDate(19, 'Tishrei', 5783);
          const saturday = hdate.onOrAfter(6);
          navigate("AliyahSelectScreen", { readingId: dateToStr(saturday) });
        }}
        buttonTitle="This Week's Torah Readings"
      />
      <CustomButton onPress={() => navigate("About")} buttonTitle="About this App" />
    </ScrollView>
  );
}

function AboutScreen() {
  return (
    <View style={styles.aboutPage}>
      <Text style={styles.aboutPageText}>
        PocketTorah is a labor of love maintained by Russel Neiss & Charlie Schwartz.
      </Text>
      <Text style={styles.aboutPageText}>
        Initially funded by the Jewish New Media Innovation Fund, PocketTorah is designed to help
        you learn the weekly Torah and Haftarah portions anywhere, at any time, for free.
      </Text>
      <Text style={styles.aboutPageText}>
        If you like it, or find it useful, please consider making a donation to the Jewish charity
        of your choice.
      </Text>
      <Text style={styles.aboutPageHeader}>Torah Readers:</Text>
      <View>
        <Text style={styles.aboutPageListItem}>Etta Abramson</Text>
        <Text style={styles.aboutPageListItem}>Joshua Foster</Text>
        <Text style={styles.aboutPageListItem}>Eitan Konigsberg</Text>
        <Text style={styles.aboutPageListItem}>Eytan Kurshan</Text>
        <Text style={styles.aboutPageListItem}>Ari Lucas</Text>
        <Text style={styles.aboutPageListItem}>Rabbi Ita Paskind</Text>
        <Text style={styles.aboutPageListItem}>Rebecca Russo</Text>
        <Text style={styles.aboutPageListItem}>Joshua Schwartz</Text>
        <Text style={styles.aboutPageListItem}>Abigail Teller</Text>
      </View>
    </View>
  );
}

function TorahReadingsScreen({ navigation }: ScreenProps<"TorahReadingsScreen">) {
  const { navigate } = navigation;

  //create button for each parsha
  var content = (hebcalParshiot as Parshah[]).map((parshah) => (
    <CustomButton
      key={parshah}
      onPress={() => navigate("AliyahSelectScreen", { readingId: parshah })}
      buttonTitle={parshah}
    />
  ));

  return (
    <View>
      <ScrollView>{content}</ScrollView>
    </View>
  );
}

function AliyahSelectScreen({ navigation, route }: ScreenProps<"AliyahSelectScreen">) {
  const { readingId } = route.params;

  const reading = useMemo(() => getLeyning(readingId), [readingId]);

  useEffect(() => {
    navigation.setOptions({ title: reading.name.en });
  }, [navigation, reading.name.en]);

  const content = aliyahNums.map((num) => (
    <CustomButton
      key={num}
      onPress={() => navigation.navigate("PlayViewScreen", { readingId, aliyah: num })}
      buttonTitle={`${aliyahName(num)}: ${
        num === "H" ? reading.haftara : formatAliyahShort(reading.fullkriyah[num], false)
      }`}
    />
  ));
  return <ScrollView>{content}</ScrollView>;
}

const aliyahName = (num: AliyahNum) =>
  num === "M" ? "Maftir Aliyah" : num == "H" ? "Haftarah" : `Aliyah ${num}`;

const isParshah = (x: string): x is Parshah => x in audioMap;

const getLeyning = (readingId: ReadingId): Leyning => {
  if (isParshah(readingId)) {
    return getLeyningForParsha(readingId);
  } else {
    const d = dateFromStr(readingId);
    if (!d) throw new Error("bad date");
    return getLeyningOnDate(d, false);
  }
};

const dateToStr = (date: HDate) =>
  `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}` as const;
const dateFromStr = (str: string): HDate | null => {
  const m = /^(\d+)-(\d+)-(\d+)$/.exec(str);
  if (!m) return null;
  return m && new HDate(+m[3], +m[2], +m[1]);
};

type ImportType<T extends { [k: string]: () => Promise<{ default: any }> }> =
  ImportMap<T>[keyof ImportMap<T>];
type ImportMap<T extends { [k: string]: () => Promise<{ default: any }> }> = {
  [k in keyof T]: Awaited<ReturnType<T[k]>>["default"];
};
type ObjValues<T> = T extends T ? T[keyof T] : never;
type Labels = ImportType<typeof labelsMap>;
type Parshah = keyof typeof maftirOffset;
type TorahBookName = keyof typeof labelsMap;
type BookName = keyof typeof transBookMap;

const getReading = (leyning: Leyning, num: AliyahNum) => {
  const aliyah = num === "H" ? leyning.haft : leyning.fullkriyah[num];
  return Array.isArray(aliyah) ? aliyah : [aliyah];
};

function PlayViewScreen({ route, navigation }: ScreenProps<"PlayViewScreen">) {
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
    const parshahBook = BOOK[parshiyot[parshah].book] as TorahBookName;
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

  if (!book || (!translationOn && !transBook)) {
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
    let [curChapter, curVerse] = parseChV(aliyah.b);
    const [endChapter, endVerse] = parseChV(aliyah.e);
    while (!(curChapter == endChapter && curVerse == endVerse)) {
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
      curVerse++;
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

// const PocketTorah = StackNavigator({
//   Home: { screen: HomeScreen },
//   About: { screen: AboutScreen },
//   TorahReadingsScreen: { screen: TorahReadingsScreen },
//   AliyahSelectScreen: { screen: AliyahSelectScreen },
//   PlayViewScreen: { screen: PlayViewScreen },
// });

type Params = {
  Home: undefined;
  About: undefined;
  TorahReadingsScreen: undefined;
  AliyahSelectScreen: {
    readingId: ReadingId;
  };
  PlayViewScreen: {
    readingId: ReadingId;
    aliyah: AliyahNum;
  };
};
type ReadingId = Parshah | `${number}-${number}-${number}`;
const aliyahNums = ["1", "2", "3", "4", "5", "6", "7", "M", "H"] as const;
type AliyahNum = (typeof aliyahNums)[keyof typeof aliyahNums & number];
type ScreenProps<RouteName extends keyof Params> = StackScreenProps<Params, RouteName>;

const Stack = createStackNavigator<Params>();

// const linking = {
//   config: {
//     screens: {
//       Home: "/",
//       About: "/?about",
//       TorahReadingsScreen: "/?books",
//       AliyahSelectScreen: "/?parshah/:parshah",
//       PlayViewScreen: "/?parsha=:parsha"
//     },
//   },
// };

const App = () => (
  <NavigationContainer
    documentTitle={{
      formatter: (options, route) => `PocketTorah - ${options?.title ?? route?.name}`,
    }}
  >
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: "Home" }} />
      <Stack.Screen name="About" component={AboutScreen} options={{ title: "About" }} />
      <Stack.Screen
        name="TorahReadingsScreen"
        component={TorahReadingsScreen}
        options={{ title: "Torah Readings" }}
      />
      <Stack.Screen name="AliyahSelectScreen" component={AliyahSelectScreen} />
      <Stack.Screen
        name="PlayViewScreen"
        component={PlayViewScreen}
        options={({ route }) => ({ cardStyle: { maxHeight: "100%" } })}
      />
    </Stack.Navigator>
  </NavigationContainer>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    top: 30,
  },
  header: {
    fontSize: 20,
    textAlign: "center",
    marginTop: 20,
    marginRight: 10,
    marginLeft: 10,
    marginBottom: 10,
  },
  instructions: {
    textAlign: "center",
    color: "#333333",
    marginBottom: 5,
  },
  button: {
    margin: 10,
    padding: 10,
    backgroundColor: "#ccc",
    textAlign: "center",
  },

  word: {
    flex: 0,
    padding: 4,
    fontFamily: platformSelect({ android: "TaameyFrank-taamim-fix" }, "Taamey Frank Taamim Fix"),
  },
  stam: {
    flex: 0,
    padding: 4,
    fontFamily: platformSelect({ android: "stamashkenazclm-webfont" }, "Stam Ashkenaz CLM"),
  },
  active: {
    backgroundColor: "#ffff9d",
  },
  footer: {
    flexDirection: "row",
    alignItems: "stretch",
    alignContent: "stretch",
  },
  footerButton: {
    flexGrow: 1,
    width: 10,
    padding: 10,
    alignItems: "center",
    backgroundColor: "#efeff2",
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: "#d9d9de",
  },
  footerButtonInner: {
    fontSize: 12,
    textAlign: "center",
  },
  verseNum: {
    marginBottom: platformSelect({ web: 0 }, 10),
    fontSize: 10,
    fontFamily: "inital",
    paddingRight: platformSelect({ android: 5 }, null),
    // @ts-ignore
    verticalAlign: platformSelect({ web: "100%" }, null),
  },
  // @ts-ignore
  verseNumWrapper: platformSelect({ web: { display: "contents" } }, {}),
  modalHeader: {
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
  },
  modalSection: {
    borderColor: "#d9d9de",
    borderTopWidth: 1,
    marginTop: 10,
    padding: 10,
  },
  modalFooter: {
    marginTop: 50,
  },
  aboutPage: {
    margin: 10,
  },
  aboutPageText: {
    marginTop: 10,
  },
  aboutPageHeader: {
    fontWeight: "bold",
    marginTop: 10,
  },
  aboutPageListItem: {
    marginLeft: 10,
    marginTop: 5,
  },
});

export default App;
