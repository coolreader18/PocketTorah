/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, { useEffect, useMemo } from "react";
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from "react-native";

import {
  NavigationContainer,
  getPathFromState,
  getStateFromPath,
  LinkingOptions,
} from "@react-navigation/native";
import { StackScreenProps, createStackNavigator } from "@react-navigation/stack";

import maftirOffset from "../data/maftirOffset.json";
import { HDate, parshiot as hebcalParshiot } from "@hebcal/core";
import { getLeyningOnDate, getLeyningForParsha, formatAliyahShort, Leyning } from "@hebcal/leyning";

import { audio as audioMap, fonts } from "./assetImports";

import { platformSelect } from "./utils";
import { PlaySettings, PlayViewScreen } from "./PlayViewScreen";
import { useFonts } from "expo-font";
import { SettingsProvider, useSettings } from "./settings";
import { CalendarScreen } from "./CalendarScreen";

type CustomButtonProps = {
  onPress?: () => void;
  style?: object;
  buttonTitle: string;
  disabled?: boolean;
};

export function CustomButton({ onPress, style, buttonTitle, disabled }: CustomButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} style={style} disabled={disabled}>
      <Text style={styles.button}>{buttonTitle}</Text>
    </TouchableOpacity>
  );
}

export function FooterButton({ onPress, style, buttonTitle, disabled }: CustomButtonProps) {
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
      <CustomButton onPress={() => navigate("Calendar")} buttonTitle="Calendar of Readings" />
      <CustomButton onPress={() => navigate("Settings")} buttonTitle="Settings" />
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
  const [{ il }] = useSettings();

  const reading = useMemo(() => getLeyning(readingId, il), [readingId]);

  useEffect(() => {
    navigation.setOptions({ title: reading.name.en });
  }, [navigation, reading.name.en]);

  const kriyah = reading.fullkriyah ?? reading.weekday!;
  const namePrefix = reading.fullkriyah ? "" : "Weekday ";
  const special = !reading.parsha;

  const content = aliyahNums
    .filter((num) => num in kriyah || (num === "H" && reading.haftara))
    .map((num) => (
      <CustomButton
        key={num}
        onPress={() => navigation.navigate("PlayViewScreen", { readingId, aliyah: num })}
        buttonTitle={`${namePrefix}${aliyahName(num)}: ${
          num === "H"
            ? reading.haftara
            : formatAliyahShort(kriyah[num], special || kriyah[num].k != kriyah[1].k)
        }`}
      />
    ));
  return <ScrollView>{content}</ScrollView>;
}

const aliyahName = (num: AliyahNum) =>
  num === "M" ? "Maftir Aliyah" : num == "H" ? "Haftarah" : `Aliyah ${num}`;

const isParshah = (x: string): x is Parshah => x in audioMap;

export const getLeyning = (readingId: ReadingId, il: boolean): Leyning => {
  if (isParshah(readingId)) {
    return getLeyningForParsha(readingId);
  } else {
    const d = dateFromStr(readingId);
    if (!d) throw new Error("bad date");
    return getLeyningOnDate(d, il);
  }
};

declare module "@hebcal/leyning" {
  export function getLeyningOnDate(hdate: HDate, il: boolean, wantarray?: false): Leyning;
  export function getLeyningOnDate(hdate: HDate, il: boolean, wantarray: true): Leyning[];
}

export const dateToStr = (date: HDate) =>
  `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}` as const;

const dateFromStr = (str: string): HDate | null => {
  const m = /^(\d+)-(\d+)-(\d+)$/.exec(str);
  if (!m) return null;
  return m && new HDate(+m[3], +m[2], +m[1]);
};

export type Parshah = keyof typeof maftirOffset;

const SettingsScreen = ({ navigation }: ScreenProps<"Settings">) => (
  <PlaySettings
    closeSettings={() => {
      if (navigation.canGoBack()) navigation.goBack();
      else navigation.replace("Home");
    }}
    setAudioSpeed={() => {}}
  />
);

// const calculateDates =

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
  Settings: undefined;
  TorahReadingsScreen: undefined;
  Calendar: undefined;
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
export type AliyahNum = (typeof aliyahNums)[keyof typeof aliyahNums & number];
export type ScreenProps<RouteName extends keyof Params> = StackScreenProps<Params, RouteName>;

const Stack = createStackNavigator<Params>();

const linkingConfig: LinkingOptions<Params>["config"] = {
  screens: {
    Home: "/",
    About: "/about",
    Settings: "/settings",
    TorahReadingsScreen: "/books",
    Calendar: "/calendar",
    AliyahSelectScreen: "/reading/:readingId",
    PlayViewScreen: "/reading/:readingId/:aliyah",
  },
};
const linking: LinkingOptions<Params> = {
  prefixes: [],
  config: linkingConfig,
  getStateFromPath: (path, options) => {
    const config = getStateFromPath(rmPrefix(path), options);
    if (config) {
      for (const route of config.routes) {
        if (route.path != null) (route as any).path = addPrefix(route.path);
      }
    }
    return config;
  },
  getPathFromState: (state, options) => {
    return addPrefix(getPathFromState(state, options));
  },
};
const baseUrl = "/PocketTorah/";
const urlPrefix = "?";
const rmPrefix = (s: string) => {
  if (s.startsWith(baseUrl)) s = s.slice(baseUrl.length);
  s ||= "/";
  return s.startsWith(urlPrefix) ? "/" + s.slice(urlPrefix.length) : s;
};
const addPrefix = (s: string) =>
  s === "/" ? baseUrl : s.startsWith(baseUrl + urlPrefix) ? s : baseUrl + urlPrefix + s.slice(1);

const App = () => {
  useFonts(fonts);
  return (
    <NavigationContainer
      linking={linking}
      documentTitle={{
        formatter: (options, route) => `PocketTorah - ${options?.title ?? route?.name}`,
      }}
    >
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen
          name="TorahReadingsScreen"
          component={TorahReadingsScreen}
          options={{ title: "Torah Readings" }}
        />
        <Stack.Screen name="AliyahSelectScreen" component={AliyahSelectScreen} />
        <Stack.Screen
          name="PlayViewScreen"
          component={PlayViewScreen}
          options={{ cardStyle: { maxHeight: "100%" } }}
        />
        <Stack.Screen name="Calendar" component={CalendarScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export const styles = StyleSheet.create({
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
    fontFamily: "Taamey Frank Taamim Fix",
  },
  stam: {
    flex: 0,
    padding: 4,
    fontFamily: "Stam Ashkenaz CLM",
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

export default () => (
  <SettingsProvider>
    <App />
  </SettingsProvider>
);
