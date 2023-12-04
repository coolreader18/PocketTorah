import { ScrollView, View } from "react-native";
import { ScreenProps } from "./App";
import { CustomButton } from "./theming";
import { useMemo } from "react";
import { PlayView } from "./PlayViewScreen";
import { tropeAudio, tropeLabels, tropeText } from "./assetImports";
import { useScreenTitle } from "./utils";

const tropeTypes = ["torah", "haftarah", "esther", "eicha", "3megillot", "hhd"] as const;
export type TropeType = (typeof tropeTypes)[number];

export const TropePhrases = ({ navigation }: ScreenProps<"TropePhrases">) => {
  useScreenTitle(navigation, "Tropes");
  return (
    <View>
      <ScrollView>
        {tropeTypes.map((tropeType) => (
          <CustomButton
            onPress={() => navigation.navigate("TropeSelectScreen", { tropeType })}
            key={tropeType}
            buttonTitle={tropeText[tropeType]().title}
          />
        ))}
      </ScrollView>
    </View>
  );
};

export const TropeSelectScreen = ({ route, navigation }: ScreenProps<"TropeSelectScreen">) => {
  const { tropeType } = route.params;
  const { title, tropes } = tropeText[tropeType]();
  useScreenTitle(navigation, `${title} Tropes`);
  return (
    <ScrollView>
      {Object.entries(tropes).map(([trope, { name_he }]) => (
        <CustomButton
          key={trope}
          onPress={() => navigation.navigate("TropePlayScreen", { tropeType, trope: trope })}
          buttonTitle={name_he}
        />
      ))}
    </ScrollView>
  );
};

export const TropePlayScreen = ({ navigation, route }: ScreenProps<"TropePlayScreen">) => {
  const { tropeType, trope } = route.params;
  const typeInfo = tropeText[tropeType]();
  const tropeInfo = typeInfo.tropes[trope];
  const verses = useMemo(() => tropeInfo.text.map((words) => ({ words })), [tropeType, trope]);

  useScreenTitle(navigation, `${typeInfo.title} Tropes - ${tropeInfo.name_he}`);

  const audioSource = [tropeAudio[tropeType][trope]];

  const audioLabels = useMemo(
    () => Promise.resolve([tropeLabels[tropeType][trope]]),
    [tropeType, trope],
  );

  return (
    <PlayView
      {...{ verses, audioSource, audioLabels, navigation }}
      forceLinebreakVerses
      singleVerseAudio
    />
  );
};
