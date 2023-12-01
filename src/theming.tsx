import { DarkTheme, DefaultTheme } from "@react-navigation/native";
import * as RN from "react-native";
import { platformSelect } from "./utils";
import { useDarkMode } from "./App";
import { JSXElementConstructor } from "react";
import React from "react";
import { TouchableOpacity } from "react-native";

export const wrapComponent =
  <P extends { style?: RN.StyleProp<any> }>(
    Elem: JSXElementConstructor<P>,
    styleName: keyof Styles,
  ) =>
  ({ style, ...props }: P) => {
    const styles = useStyles();
    // @ts-ignore
    return <Elem style={[styles[styleName], style]} {...props} />;
  };

export const Text = wrapComponent(RN.Text, "text");
export const Footer = wrapComponent(RN.View, "footer");
export const ModalSection = wrapComponent(RN.View, "modalSection");

const makeStyles = (dark: boolean) => {
  const navTheme = dark ? DarkTheme : DefaultTheme;
  const borderColor = navTheme.colors.border;
  return RN.StyleSheet.create({
    text: {
      color: navTheme.colors.text,
    },
    button: {
      margin: 10,
      padding: 10,
      backgroundColor: dark ? "#35393B" : "#ccc",
      textAlign: "center",
    },

    word: { flex: 0, padding: 4 },
    wordMaqaf: { paddingLeft: 0 },
    wordPostMaqaf: { paddingRight: 0 },
    sofAudioMismatch: {
      color: dark ? "rgb(255, 111, 111)" : "rgb(221, 0, 0)",
    },
    active: {
      color: dark ? "rgb(31, 31, 51)" : undefined,
      backgroundColor: dark ? "#ffff00" : "#ffff9d",
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
      backgroundColor: dark ? "#202324" : "#efeff2",
      borderWidth: 1,
      borderRightWidth: 0,
      borderColor,
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
    baseBackground: {
      backgroundColor: navTheme.colors.background,
    },
    modalContainer: {
      paddingTop: 22,
    },
    modalHeader: {
      fontSize: 17,
      fontWeight: "600",
      textAlign: "center",
    },
    modalSection: {
      borderColor,
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
    settingsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
  });
};

type Styles = Pick<ReturnType<typeof makeStyles>, keyof ReturnType<typeof makeStyles>>;

const lightStyles = makeStyles(false) as Styles;
const darkStyles = makeStyles(true) as Styles;

export const useStyles = () => (useDarkMode() ? darkStyles : lightStyles);

export const useNavigationTheme = () => (useDarkMode() ? DarkTheme : DefaultTheme);
type CustomButtonProps = {
  onPress?: () => void;
  style?: object;
  buttonTitle: string;
  disabled?: boolean;
};

export function CustomButton({ onPress, style, buttonTitle, disabled }: CustomButtonProps) {
  const styles = useStyles();
  return (
    <TouchableOpacity {...{ onPress, style, disabled }}>
      <Text style={styles.button}>{buttonTitle}</Text>
    </TouchableOpacity>
  );
}

export function FooterButton({ onPress, style, buttonTitle, disabled }: CustomButtonProps) {
  const styles = useStyles();
  return (
    <TouchableOpacity
      {...{ onPress, disabled }}
      style={[styles.footerButton, disabled && { opacity: 0.5 }, style]}
    >
      <Text style={styles.footerButtonInner}>{buttonTitle}</Text>
    </TouchableOpacity>
  );
}

const makeCalendarTheme = (dark: boolean): import("react-native-calendars/src/types").Theme => {
  // const navTheme = dark ? DarkTheme : DefaultTheme;
  const darkerText = "#2d4150";
  const lighterText = "hsl(208 15% 70%)";
  return {
    textSectionTitleColor: "rgb(111, 117, 123)",
    textDisabledColor: dark ? darkerText : lighterText,
    dayTextColor: dark ? "rgb(196, 210, 223)" : darkerText,
    calendarBackground: "rgba(0, 0, 0, 0)",
    monthTextColor: dark ? "#fff" : undefined,
  };
};

const lightCalendarTheme = makeCalendarTheme(false);
const darkCalendarTheme = makeCalendarTheme(true);
export const useCalendarTheme = () => (useDarkMode() ? darkCalendarTheme : lightCalendarTheme);
