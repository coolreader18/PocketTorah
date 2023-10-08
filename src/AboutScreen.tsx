import React from "react";
import { View } from "react-native";
import { Text, wrapComponent } from "./theming";

const AboutContainer = wrapComponent(View, "aboutPage");
const AboutText = wrapComponent(Text, "aboutPageText");
const AboutHeader = wrapComponent(Text, "aboutPageHeader");
const AboutListItem = wrapComponent(Text, "aboutPageListItem");

export const AboutScreen = () => (
  <AboutContainer>
    <AboutText>
      PocketTorah is a labor of love maintained by Russel Neiss & Charlie Schwartz.
    </AboutText>
    <AboutText>
      Initially funded by the Jewish New Media Innovation Fund, PocketTorah is designed to help you
      learn the weekly Torah and Haftarah portions anywhere, at any time, for free.
    </AboutText>
    <AboutText>
      If you like it, or find it useful, please consider making a donation to the Jewish charity of
      your choice.
    </AboutText>
    <AboutHeader>Torah Readers:</AboutHeader>
    <View>
      <AboutListItem>Etta Abramson</AboutListItem>
      <AboutListItem>Joshua Foster</AboutListItem>
      <AboutListItem>Eitan Konigsberg</AboutListItem>
      <AboutListItem>Eytan Kurshan</AboutListItem>
      <AboutListItem>Ari Lucas</AboutListItem>
      <AboutListItem>Rabbi Ita Paskind</AboutListItem>
      <AboutListItem>Rebecca Russo</AboutListItem>
      <AboutListItem>Joshua Schwartz</AboutListItem>
      <AboutListItem>Abigail Teller</AboutListItem>
    </View>
    <AboutHeader>Trope Provided by:</AboutHeader>
    <View>
      <AboutListItem>Cantor Elizabeth K. Sacks</AboutListItem>
    </View>
  </AboutContainer>
);
