/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Button,
  Modal,
  Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';

import { NavigationContainer } from '@react-navigation/native';
import { StackNavigationProp, StackScreenProps, createStackNavigator } from '@react-navigation/stack';

import maftirOffset from '../data/maftirOffset.json';
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

import {
  audio as audioMap,
  labels as labelsMap,
  bookMap,
  transBookMap,
} from "./assetImports";

import binarySearch from 'binary-search';
import { Audio, AVPlaybackStatusSuccess } from "expo-av";
import { platformSelect } from './utils';


type CustomButtonProps = {
  doOnPress?: () => void;
  style?: object;
  buttonTitle: string;
};

function CustomButton({ doOnPress, style, buttonTitle }: CustomButtonProps) {
  return (
    <TouchableOpacity onPress={doOnPress} style={style}>
      <Text style={styles.button}>{buttonTitle}</Text>
    </TouchableOpacity>
  );
}

function FooterButton({ doOnPress, style, buttonTitle }: CustomButtonProps) {
  return (
    <TouchableOpacity onPress={doOnPress} style={style}>
      <Text style={styles.footerButtonInner}>{buttonTitle}</Text>
    </TouchableOpacity>
  );
}

function HomeScreen({ navigation }: ScreenProps<"Home">) {
  const { navigate } = navigation;

  return (
    <ScrollView>
      <CustomButton
        doOnPress={() => navigate("TorahReadingsScreen")}
        buttonTitle="List of Torah Readings"
      />
      <CustomButton
        doOnPress={() => navigate("ParshahHashavuaScreen")}
        buttonTitle="This Week's Torah Readings"
      />
      <CustomButton
        doOnPress={() => navigate("About")}
        buttonTitle="About this App"
      />
    </ScrollView>
  );
}

function AboutScreen() {
  return (
    <View style={styles.aboutPage}>
      <Text style={styles.aboutPageText}>
        PocketTorah is a labor of love maintained by Russel Neiss & Charlie
        Schwartz.
      </Text>
      <Text style={styles.aboutPageText}>
        Initially funded by the Jewish New Media Innovation Fund, PocketTorah is
        designed to help you learn the weekly Torah and Haftarah portions
        anywhere, at any time, for free.
      </Text>
      <Text style={styles.aboutPageText}>
        If you like it, or find it useful, please consider making a donation to
        the Jewish charity of your choice.
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

function TorahReadingsScreen({
  navigation,
}: ScreenProps<"TorahReadingsScreen">) {
  const { navigate } = navigation;

  //create button for each parsha
  var content = hebcalParshiot.map((parshah) => (
    <CustomButton
      key={parshah}
      doOnPress={() => navigate("AliyahSelectScreen", { parshah })}
      buttonTitle={parshah}
    />
  ));

  return (
    <View>
      <ScrollView>{content}</ScrollView>
    </View>
  );
}

function AliyahSelectScreen({
  route,
  navigation,
}: ScreenProps<"AliyahSelectScreen">) {
  const reading = getLeyningForParsha(route.params.parshah);
  return <AliyahSelect navigation={navigation} reading={reading} />;
}

type AliyahSelectProps = {
  navigation: StackNavigationProp<Params>;
  reading: Leyning;
};

function AliyahSelect({ navigation, reading }: AliyahSelectProps) {
  const { navigate } = navigation;
  const parshah = reading.name.en as Parshah;

  useEffect(() => {
    navigation.setOptions({ title: parshah });
  }, [navigation]);

  const readings = Object.entries(reading.fullkriyah).map(([num, aliyah]) => {
    const aliyahName = num === "M" ? "Maftir Aliyah" : `Aliyah ${num}`;
    return {
      num: num as AliyahNum,
      buttonTitle: `${aliyahName}: ${formatAliyahShort(aliyah, false)}`,
    };
  });
  readings.push({ num: "H", buttonTitle: `Haftarah: ${reading.haftara}` });
  const content = readings.map(({ num, buttonTitle }) => (
    <CustomButton
      key={num}
      doOnPress={() => navigate("PlayViewScreen", { parshah, aliyah: num })}
      buttonTitle={buttonTitle}
    />
  ));
  return <ScrollView>{content}</ScrollView>;
}

function ParshahHashavuaScreen({
  navigation,
}: ScreenProps<"ParshahHashavuaScreen">) {
  //figure out current parshah
  const today = new HDate();
  // const hdate = new HDate(28, 'Tamuz', 5795);
  // const hdate = new HDate(19, 'Tishrei', 5783);
  let saturday = today.onOrAfter(6);
  let reading;
  // find the next shabbat reading that is not a holiday (we don't have those readings)
  do {
    reading = getLeyningOnDate(saturday, false);
    saturday = saturday.add(1, "week");
  } while (reading.parsha == null);

  return <AliyahSelect navigation={navigation} reading={reading} />;
}

type ImportType<T extends { [k: string]: () => Promise<{ default: any }> }> =
  ImportMap<T>[keyof ImportMap<T>];
type ImportMap<T extends { [k: string]: () => Promise<{ default: any }> }> = {
  [k in keyof T]: Awaited<ReturnType<T[k]>>["default"];
};
type Labels = ImportType<typeof labelsMap>;
type Parshah = keyof typeof maftirOffset;
type TorahBookName = keyof typeof labelsMap;
type BookName = keyof typeof transBookMap;

function PlayViewScreen({ route, navigation }: ScreenProps<"PlayViewScreen">) {
  const { params } = route;
  const aliyah = useMemo(() => {
    const reading = getLeyningForParsha(params.parshah);
    const aliyah =
      params.aliyah === "H" ? reading.haft : reading.fullkriyah[params.aliyah];
    return Array.isArray(aliyah) ? aliyah : [aliyah];
  }, [params.parshah, params.aliyah]);

  // in the files in data/, the maftir is in the 7th aliyah, so we need to
  // adjust for that with startingWordOffset
  const dataAliyahNum = params.aliyah === "M" ? "7" : params.aliyah;
  const startingWordOffset =
    params.aliyah === "M" ? maftirOffset[params.parshah] : 0;

  const audio = useAudio(audioMap[params.parshah][dataAliyahNum]);

  const parshahBook = BOOK[parshiyot[params.parshah].book] as TorahBookName;
  const allLabels = usePromise<Labels>(labelsMap[parshahBook], [parshahBook]);
  const labels: number[] =
    allLabels && (allLabels as any)[params.parshah][dataAliyahNum];

  const book = usePromise<Book[]>(
    () => Promise.all(aliyah.map(({ k }) => bookMap[k as BookName]())),
    [aliyah]
  );
  const transBook = usePromise<TransBook[]>(
    () => Promise.all(aliyah.map(({ k }) => transBookMap[k as BookName]())),
    [aliyah]
  );

  const [textSizeMultiplier, setTextSizeMultiplier] = useState(1);
  const [modalVisible, setModalVisible] = useState(false);
  const [translationOn, setTranslationOn] = useState(false);
  const [tikkunOn, setTikkunOn] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ marginRight: 5 }}>
          <Button title="Settings" onPress={() => setModalVisible(true)} />
        </View>
      ),
    });
  }, [navigation]);

  if (!audio || !labels || !book || !transBook) {
    return (
      <View>
        <ActivityIndicator size="large" />
        <Text>Loading....</Text>
      </View>
    );
  } else {
    const changeAudioTime = (wordIndex: number) => {
      var newTime = labels[wordIndex - startingWordOffset];
      audio.setCurrentTime(newTime);
    };

    const unBitwiseNot = (x: number) => (x < 0 ? ~x : x);
    const audioInactive = !audio.playing && audio.currentTime == 0;
    const activeWordIndex = audioInactive
      ? null
      : unBitwiseNot(
          binarySearch(labels, audio.currentTime, (a, b) =>
            a === b ? -1 : a - b
          )
        ) -
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
            audioSpeed={audio.speed}
            setAudioSpeed={audio.setSpeed}
            closeSettings={() => setModalVisible(false)}
          />
        </Modal>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 5 }}
        >
          <Verses
            changeAudioTime={changeAudioTime}
            translationFlag={translationOn}
            tikkunFlag={tikkunOn}
            textSizeMultiplier={textSizeMultiplier}
            activeWordIndex={activeWordIndex}
            book={book}
            transBook={transBook}
            aliyah={aliyah}
          />
        </ScrollView>
        <View style={styles.footer}>
          <FooterButton
            style={styles.footerButton}
            doOnPress={() => {
              if (audioInactive) {
                changeAudioTime(0);
              } else {
                audio.toggle();
              }
            }}
            buttonTitle={audio.playing ? "Pause" : "Play"}
          />
          <FooterButton
            style={styles.footerButton}
            doOnPress={() => setTranslationOn((b) => !b)}
            buttonTitle={translationOn ? "Translation Off" : "Translation On"}
          />
          <FooterButton
            style={styles.footerButton}
            doOnPress={() => setTikkunOn((b) => !b)}
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
  audioSpeed: number;
  setAudioSpeed: (v: number) => void;
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
  const [savedAudioSpeed, setSavedAudioSpeed] = useState(audioSpeed);

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
          <Text style={getTextStyle(false, settingsTextSize)}>
            בְּרֵאשִׁ֖ית
          </Text>
          <Text style={getTextStyle(true, settingsTextSize)}>בראשית</Text>
        </View>
        <View style={styles.modalSection}>
          <Text>Set Audio Speed:</Text>
          <Slider
            minimumValue={0.5}
            maximumValue={2}
            value={audioSpeed}
            onValueChange={setAudioSpeed}
          />
        </View>

        <View style={styles.modalFooter}>
          <CustomButton
            doOnPress={() => {
              setSavedAudioSpeed(audioSpeed);
              setTextSizeMultiplier(settingsTextSize);
              closeSettings();
            }}
            buttonTitle="Save Settings"
          />
          <CustomButton
            doOnPress={() => {
              setAudioSpeed(savedAudioSpeed);
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

function useAudio(title: import("expo-av").AVPlaybackSource) {
  const [audio, setAudio] = useState<Audio.Sound | null>(null);
  const [status, setStatus] = useState<AVPlaybackStatusSuccess | null>(null);
  useEffect(() => {
    let ignore = false;
    let thisAudio: Audio.Sound | null = null;
    Audio.Sound.createAsync(
      title,
      { progressUpdateIntervalMillis: __DEV__ ? 500 : 50 },
      (status) => {
        if (!status.isLoaded) {
          if (status.error) console.error(status.error);
          return;
        }
        setStatus(status);
      }
    ).then(({ sound }) => {
      if (ignore) return;
      setAudio(sound);
      thisAudio = sound;
    });
    return () => {
      ignore = true;
      if (thisAudio) thisAudio.unloadAsync();
      setAudio(null);
    };
  }, [title]);
  if (!audio || !status) return null;
  return {
    currentTime: status.positionMillis / 1000,
    setCurrentTime: (time: number) => {
      audio.setStatusAsync({ positionMillis: time * 1000, shouldPlay: true });
    },
    playing: status.isPlaying,
    play: () => {
      audio.setStatusAsync({ shouldPlay: true });
    },
    pause: () => {
      audio.setStatusAsync({ shouldPlay: false });
    },
    toggle: () => {
      audio.setStatusAsync({ shouldPlay: !status.isPlaying });
    },
    speed: status.rate,
    setSpeed: (speed: number) => {
      audio.setStatusAsync({
        rate: speed,
        shouldCorrectPitch: true,
        pitchCorrectionQuality: Audio.PitchCorrectionQuality.Low,
      });
    },
  };
}

function usePromise<T>(
  getProm: () => Promise<T>,
  dependencies: React.DependencyList
): T | null {
  const [result, setResult] = useState<T | null>(null);
  useEffect(() => {
    let ignore = false;
    getProm()
      .then((result) => {
        if (!ignore) setResult(result);
      })
      .catch((err) => console.error(err));
    return () => {
      ignore = true;
    };
  }, dependencies);
  return result;
}

function parseChV(s: string): [number, number] {
  const [ch, v] = s.split(":");
  return [parseInt(ch) - 1, parseInt(v) - 1]
}

type Book = ImportType<typeof bookMap>;
type TransBook = ImportType<typeof transBookMap>;
type VersesProps = {
  aliyah: Aliyah[];
  book: Book[];
  transBook: TransBook[];
  translationFlag: boolean;
  activeWordIndex: number | null;
  tikkunFlag: boolean;
  changeAudioTime: (wordIndex: number) => void;
  textSizeMultiplier: number;
};
function Verses(props: VersesProps) {
  const { aliyah, book, transBook, translationFlag, activeWordIndex } = props;
  const verseText: React.JSX.Element[] = [];
  aliyah.forEach((aliyah, i) => {
    const b = book[i].Tanach.tanach.book;
    const t = transBook[i];
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
      verseText.push(
        <Verse
          {...props}
          verse={verse}
          curWordIndex={lastWordIndex}
          activeWordIndex={activeWordIndex}
          chapterIndex={curChapter}
          verseIndex={curVerse}
          key={`${curChapter}:${curVerse}`}
        />
      );
      if (translationFlag) {
        verseText.push(
          <Text
            key={`translation${curChapter}:${curVerse}`}
            style={{ paddingHorizontal: 5 }}
          >
            {t.text[curChapter][curVerse]}
          </Text>
        );
      }

      lastWordIndex += verse.w.length;
      curVerse++;
    }
  });

  return translationFlag ? <View>{verseText}</View> : <Text>{verseText}</Text>;
}

const getTextStyle = (tikkun: boolean, textSizeMultiplier: number) => [
  tikkun ? styles.stam : styles.word,
  { fontSize: (tikkun ? 30 : 36) * textSizeMultiplier },
];

type VerseProps = {
  tikkunFlag: boolean,
  changeAudioTime: (wordIndex: number) => void,
  textSizeMultiplier: number,
  curWordIndex: number,
  chapterIndex: number,
  verseIndex: number,
  verse: NonNullable<Book['Tanach']['tanach']['book']['c'][0]>['v'][0],
  activeWordIndex: number | null,
};
function Verse(props: VerseProps) {
  const {
    tikkunFlag,
    changeAudioTime,
    textSizeMultiplier,
    curWordIndex,
    chapterIndex,
    verseIndex,
    verse,
    activeWordIndex,
  } = props;
  const textStyle = getTextStyle(tikkunFlag, textSizeMultiplier);
  const deleteRegex = tikkunFlag ? /[\/\u0591-\u05C7]/g : /\//g;
  var words = verse.w.map((word, i) => {
    const wordIndex = curWordIndex + i;
    const active = wordIndex === activeWordIndex;
    const wordElem = (
      <Text style={[textStyle, active && styles.active]}>
        {(word as string).replace(deleteRegex, "")}
      </Text>
    );
    return (
      <TouchableOpacity
        key={wordIndex}
        onPress={() => changeAudioTime(wordIndex)}
      >
        {i == 0 ? (
          <Text style={textStyle[0]}>
            <View style={styles.verseNumWrapper}>
              <Text style={styles.verseNum}>
                {chapterIndex + 1}:{verseIndex + 1}
              </Text>
            </View>
            {wordElem}
          </Text>
        ) : (
          wordElem
        )}
      </TouchableOpacity>
    );
  });

  return (
    <Text>
      <Text key="rtl">{"\u200F"}</Text>
      {words}
    </Text>
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
    parshah: string;
  };
  ParshahHashavuaScreen: undefined;
  PlayViewScreen: {
    parshah: Parshah;
    aliyah: AliyahNum;
  };
};
type AliyahNum = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "M" | "H";
type ScreenProps<RouteName extends keyof Params> = StackScreenProps<
  Params,
  RouteName
>;

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
  <NavigationContainer documentTitle={{ formatter: (options, route) => `PocketTorah - ${options?.title ?? route?.name}` }}>
   <Stack.Navigator initialRouteName="Home">
     <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
     <Stack.Screen name="About" component={AboutScreen} options={{ title: 'About' }} />
     <Stack.Screen name="TorahReadingsScreen" component={TorahReadingsScreen} options={{ title: 'Torah Readings' }} />
     <Stack.Screen name="AliyahSelectScreen" component={AliyahSelectScreen} />
     <Stack.Screen name="ParshahHashavuaScreen" component={ParshahHashavuaScreen} />
     <Stack.Screen name="PlayViewScreen" component={PlayViewScreen} options={({ route }) => ({
          title: `${route.params.parshah}`,
          cardStyle: { maxHeight: "100%" },
      })} />
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
    fontFamily: platformSelect(
      { android: "TaameyFrank-taamim-fix" },
      "Taamey Frank Taamim Fix"
    ),
  },
  stam: {
    flex: 0,
    padding: 4,
    fontFamily: platformSelect(
      { android: "stamashkenazclm-webfont" },
      "Stam Ashkenaz CLM"
    ),
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
