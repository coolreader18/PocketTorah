/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, { createContext, useContext, useMemo, useState } from "react";
import { Button, ScrollView, StyleProp, View, ViewStyle, useColorScheme } from "react-native";

import {
  NavigationContainer,
  getPathFromState,
  getStateFromPath,
  LinkingOptions,
} from "@react-navigation/native";
import {
  StackNavigationProp,
  StackScreenProps,
  createStackNavigator,
} from "@react-navigation/stack";

import { HDate, parshiot as hebcalParshiot } from "@hebcal/core";
import { formatAliyahShort, makeSummaryFromParts } from "@hebcal/leyning";

import { audio as audioMap, fonts } from "./assetImports";

import { useScreenOptions, useScreenTitle } from "./utils";
import { PlayViewScreen } from "./PlayViewScreen";
import { PlaySettings, SettingsModal } from "./SettingsScreen";
import { useFonts } from "expo-font";
import { SettingsProvider, useSettings } from "./settings";
import { CalendarScreen } from "./CalendarScreen";
import { TropePhrases, TropePlayScreen, TropeSelectScreen, TropeType } from "./trope";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { CustomButton, HeaderContainer, Text, useNavigationTheme } from "./theming";
import { AboutScreen } from "./AboutScreen";
import { fixReadingId, getLeyning } from "./leyning";
import { boolQuery } from "./utils";

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
          navigate("AliyahSelectScreen", { readingId: dateToStr(saturday.greg()) });
        }}
        buttonTitle="This Week's Torah Readings"
      />
      <CustomButton onPress={() => navigate("Calendar")} buttonTitle="Calendar of Readings" />
      <CustomButton onPress={() => navigate("TropePhrases")} buttonTitle="Tropes" />
      <CustomButton onPress={() => navigate("Settings")} buttonTitle="Settings" />
      <CustomButton onPress={() => navigate("About")} buttonTitle="About this App" />
    </ScrollView>
  );
}

function TorahReadingsScreen({ navigation }: ScreenProps<"TorahReadingsScreen">) {
  const { navigate } = navigation;

  //create button for each parsha
  const content = allParshiot.map((parshah) => (
    <CustomButton
      key={parshah}
      buttonTitle={parshah}
      onPress={() => navigate("AliyahSelectScreen", { readingId: parshah })}
    />
  ));

  return <ScrollView>{content}</ScrollView>;
}

function AliyahSelectScreen({ navigation, route }: ScreenProps<"AliyahSelectScreen">) {
  const readingId = fixReadingId(route.params.readingId);
  const [{ tri: settingsTri, il }] = useSettings();
  const tri = boolQuery(route.params.tri) ?? settingsTri;

  const reading = useMemo(() => getLeyning(readingId, { tri, il }), [readingId, tri, il]);
  if (!reading) throw new Error(`bad readingid ${readingId}`);

  useScreenTitle(navigation, reading.name.en ?? "404");

  const [modalVisible, setModalVisible] = useState(false);

  useScreenOptions(navigation, {
    headerRight: () => (
      <HeaderContainer>
        <Button title="Settings" onPress={() => setModalVisible(true)} />
      </HeaderContainer>
    ),
  });

  const kriyah = reading.aliyot;
  const namePrefix = reading.kind === "weekday" ? "Weekday " : "";
  const special = !reading.parsha;

  const content = aliyahNums
    .filter((num) => num in kriyah || (num === "H" && reading.haftara))
    .map((num) => (
      <CustomButton
        key={num}
        onPress={() =>
          navigation.navigate("PlayViewScreen", {
            readingId,
            aliyah: num,
            tri: route.params.tri === null ? "1" : route.params.tri,
          })
        }
        buttonTitle={`${namePrefix}${aliyahName(num)}: ${
          num === "H"
            ? makeSummaryFromParts(reading.haftara)
            : formatAliyahShort(kriyah[num], special || kriyah[num].k != kriyah[1].k)
        }`}
      />
    ));
  return (
    <ScrollView>
      <SettingsModal {...{ modalVisible, setModalVisible }} audio={null} />
      {content}
    </ScrollView>
  );
}

const aliyahName = (num: AliyahNum) =>
  num === "M" ? "Maftir Aliyah" : num == "H" ? "Haftarah" : `Aliyah ${num}`;

export const dateToStr = (date: HDate | Date) =>
  `${date.getFullYear()}-${
    date.getMonth() + (HDate.isHDate(date) ? 0 : 1)
  }-${date.getDate()}` as const;

export const dateFromStr = (str: string): HDate | null => {
  const x = /^(\d+)-(\d+)-(\d+)$/.exec(str);
  if (!x) return null;
  const [y, m, d] = [+x[1], +x[2], +x[3]];
  return y < 3000 ? new HDate(new Date(y, m - 1, d)) : new HDate(d, m, y);
};

export type Parshah = (typeof allParshiot)[number];
export const isParshah = (x: string): x is Parshah =>
  (allParshiot as readonly string[]).includes(x);
const allParshiot = [
  "Bereshit",
  "Noach",
  "Lech-Lecha",
  "Vayera",
  "Chayei Sara",
  "Toldot",
  "Vayetzei",
  "Vayishlach",
  "Vayeshev",
  "Miketz",
  "Vayigash",
  "Vayechi",
  "Shemot",
  "Vaera",
  "Bo",
  "Beshalach",
  "Yitro",
  "Mishpatim",
  "Terumah",
  "Tetzaveh",
  "Ki Tisa",
  "Vayakhel",
  "Pekudei",
  "Vayikra",
  "Tzav",
  "Shmini",
  "Tazria",
  "Metzora",
  "Achrei Mot",
  "Kedoshim",
  "Emor",
  "Behar",
  "Bechukotai",
  "Bamidbar",
  "Nasso",
  "Beha'alotcha",
  "Sh'lach",
  "Korach",
  "Chukat",
  "Balak",
  "Pinchas",
  "Matot",
  "Masei",
  "Devarim",
  "Vaetchanan",
  "Eikev",
  "Re'eh",
  "Shoftim",
  "Ki Teitzei",
  "Ki Tavo",
  "Nitzavim",
  "Vayeilech",
  "Ha'azinu",
  "Vezot Haberakhah",
] as const;

const SettingsScreen = ({ navigation }: ScreenProps<"Settings">) => (
  <PlaySettings
    closeSettings={() => {
      if (navigation.canGoBack()) navigation.goBack();
      else navigation.replace("Home");
    }}
    setAudioSpeed={() => {}}
  />
);

type Params = {
  Home: undefined;
  About: undefined;
  Settings: undefined;
  TorahReadingsScreen: undefined;
  Calendar: undefined;
  AliyahSelectScreen: {
    readingId: ReadingId;
    tri?: "1" | "0" | null;
  };
  PlayViewScreen: {
    readingId: ReadingId;
    aliyah: AliyahNum;
    tri?: "1" | "0" | null;
  };
  TropePhrases: undefined;
  TropeSelectScreen: { tropeType: TropeType };
  TropePlayScreen: { tropeType: TropeType; trope: string };
};
export type ReadingId = Parshah | `${number}-${number}-${number}`;
const aliyahNums = ["1", "2", "3", "4", "5", "6", "7", "M", "H"] as const;
export type AliyahNum = (typeof aliyahNums)[keyof typeof aliyahNums & number];
export type ScreenProps<RouteName extends keyof Params> = StackScreenProps<Params, RouteName>;
export type NavigationProp = StackNavigationProp<Params>;

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
    TropePhrases: "/tropes",
    TropeSelectScreen: "/tropes/:tropeType",
    TropePlayScreen: "/tropes/:tropeType/:trope",
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
  const insets = useSafeAreaInsets();
  const cardStyle: StyleProp<ViewStyle> = {
    maxHeight: "100%",
    paddingTop: insets.top,
    paddingRight: insets.right,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
  };
  const navTheme = useNavigationTheme();
  return (
    <NavigationContainer
      linking={linking}
      theme={navTheme}
      documentTitle={{
        formatter: (options, route) => `PocketTorah - ${options?.title ?? route?.name}`,
      }}
    >
      <Stack.Navigator initialRouteName="Home" screenOptions={{ cardStyle }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen
          name="TorahReadingsScreen"
          component={TorahReadingsScreen}
          options={{ title: "Torah Readings" }}
        />
        <Stack.Screen name="AliyahSelectScreen" component={AliyahSelectScreen} />
        <Stack.Screen name="PlayViewScreen" component={PlayViewScreen} />
        <Stack.Screen name="Calendar" component={CalendarScreen} />
        <Stack.Screen name="TropePhrases" component={TropePhrases} />
        <Stack.Screen name="TropeSelectScreen" component={TropeSelectScreen} />
        <Stack.Screen name="TropePlayScreen" component={TropePlayScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default () => (
  <SettingsProvider>
    <DarkModeProvider>
      <SafeAreaProvider>
        <App />
      </SafeAreaProvider>
    </DarkModeProvider>
  </SettingsProvider>
);

const DarkModeProvider = ({ children }: React.PropsWithChildren) => {
  const [{ colorTheme }] = useSettings();
  const nativeColorScheme = useColorScheme();
  const colorScheme = colorTheme === "auto" ? nativeColorScheme : colorTheme;
  const dark = colorScheme === "dark";
  return <DarkMode.Provider value={dark} children={children} />;
};

const DarkMode = createContext(false);

export const useDarkMode = () => useContext(DarkMode);
