import { ScrollView, View } from "react-native";
import { ScreenProps } from "./App";
import { CustomButton } from "./theming";
import { useMemo } from "react";
import { parseXML } from "./parseXML";
import { PlayView } from "./PlayViewScreen";
import { tropeAudio, tropeLabels, tropeXml } from "./assetImports";
import { Asset } from "expo-asset";
import { usePromise, useScreenTitle } from "./utils";

const tropeTypes = ["torah", "haftarah", "esther", "eicha", "3megillot", "hhd"] as const;
export type TropeType = (typeof tropeTypes)[number];

const tropeTypeInfo: { [k in TropeType]: { title: string; tropes: string[] } } = {
  torah: {
    title: "Torah",
    tropes: [
      "אֶתְנַחְתָּ֑א",
      "סוֹף פָּסֽוּק",
      "זָקֵף קָטָ֔ן",
      "רְבִ֗יע",
      "קַדְמָ֨א ואַזְלָ֝א",
      "גֵּרְשַׁ֞יִם/גֵּ֜רֵשׁ",
      "תְּבִ֛יר",
      "תְּלִישָא",
      "פָּזֵ֡ר",
      "יְ֚תִיב קָטָ֔ן",
      "זָקֵף גָּד֕וֹל",
      "זַרְקָא֘",
    ],
  },
  haftarah: {
    title: "Haftarah",
    tropes: [
      "אֶתְנַחְתָּ֑א",
      "סוֹף פָּסֽוּק",
      "קָטָ֔ן",
      "רְבִ֗יע",
      "תְּבִ֛יר",
      "גֵּ֜רֵשׁ",
      "גֵּרְשַׁ֞יִם",
      "תְּלִישָא",
      "יְ֚תִיב קָטָ֔ן",
      "זָקֵף גָּד֕וֹל",
      "זַרְקָא֘",
      "פָּזֵ֡ר",
      "קַדְמָ֨א ואַזְלָ֝א",
      "מֵרְכָא כּפוּלָ֦ה",
      "Sof Haftorah",
    ],
  },
  esther: {
    title: "Esther",
    tropes: [
      "אֶתְנַחְתָּ֑א",
      "סוֹף פָּסֽוּק",
      "קָטָ֔ן",
      "רְבִ֗יע",
      "תְּבִ֛יר",
      "גֵּ֜רֵשׁ",
      "גֵּרְשַׁ֞יִם",
      "תְּלִישָא",
      "יְ֚תִיב קָטָ֔ן",
      "זָקֵף גָּד֕וֹל",
      "זַרְקָא֘",
      "פָּזֵ֡ר",
      "קַדְמָ֨א ואַזְלָ֝א",
      "Sof Perek",
      "קַרְנֵי פָרָ֟ה",
      "יֵרֶח בֶּן יוֹמ֪וֹ",
    ],
  },
  eicha: {
    title: "Eicha",
    tropes: [
      "אֶתְנַחְתָּ֑א",
      "סוֹף פָּסֽוּק",
      "פַּשְׁטָא֙ קָטָ֔ן",
      "רְבִ֗יע",
      "תְּבִ֛יר",
      "גֵּ֜רֵשׁ",
      "גֵּרְשַׁ֞יִם",
      "תְּלִישָא",
      "יְ֚תִיב קָטָ֔ן",
      "זָקֵף גָּד֕וֹל",
      "זַרְקָא֘",
      "End of Chapter",
    ],
  },
  "3megillot": {
    title: "Three Megillot",
    tropes: [
      "אֶתְנַחְתָּ֑א",
      "סוֹף פָּסֽוּק",
      "קָטָ֔ן",
      "רְבִ֗יע",
      "תְּבִ֛יר",
      "גֵּ֜רֵשׁ",
      "גֵּרְשַׁ֞יִם",
      "תְּלִישָא",
      "יְ֚תִיב קָטָ֔ן",
      "זָקֵף גָּד֕וֹל",
      "זַרְקָא֘",
      "פָּזֵ֡ר",
      "קַדְמָ֨א ואַזְלָ֝א",
      "Sof Perek",
    ],
  },
  hhd: {
    title: "High Holiday",
    tropes: [
      "אֶתְנַחְתָּ֑א",
      "סוֹף פָּסֽוּק",
      "קָטָ֔ן",
      "רְבִ֗יע",
      "תְּבִ֛יר",
      "גֵּ֜רֵשׁ",
      "גֵּרְשַׁ֞יִם",
      "תְּלִישָא",
      "יְ֚תִיב קָטָ֔ן",
      "זָקֵף גָּד֕וֹל",
      "זַרְקָא֘",
      "פָּזֵ֡ר",
      "קַדְמָ֨א ואַזְלָ֝א",
      "Sof Perek",
    ],
  },
};

export const TropePhrases = ({ navigation }: ScreenProps<"TropePhrases">) => {
  useScreenTitle(navigation, "Tropes");
  return (
    <View>
      <ScrollView>
        {tropeTypes.map((tropeType) => (
          <CustomButton
            onPress={() => navigation.navigate("TropeSelectScreen", { tropeType })}
            key={tropeType}
            buttonTitle={tropeTypeInfo[tropeType].title}
          />
        ))}
      </ScrollView>
    </View>
  );
};

export const TropeSelectScreen = ({ route, navigation }: ScreenProps<"TropeSelectScreen">) => {
  const { tropeType } = route.params;
  const { title, tropes } = tropeTypeInfo[tropeType];
  useScreenTitle(navigation, `${title} Tropes`);
  return (
    <ScrollView>
      {tropes.map((trope, i) => (
        <CustomButton
          key={trope}
          onPress={() => navigation.navigate("TropePlayScreen", { tropeType, tropeIndex: i + 1 })}
          buttonTitle={trope}
        />
      ))}
    </ScrollView>
  );
};

export const TropePlayScreen = ({ navigation, route }: ScreenProps<"TropePlayScreen">) => {
  const { tropeType, tropeIndex } = route.params;
  const verses = usePromise(
    () => parseXML(Asset.fromModule(tropeXml[tropeType][tropeIndex])),
    [tropeType, tropeIndex],
  );

  const info = tropeTypeInfo[tropeType];
  useScreenTitle(navigation, `${info.title} Tropes - ${info.tropes[tropeIndex - 1]}`);

  const audioSource = tropeAudio[tropeType][tropeIndex];

  const audioLabels = useMemo(
    () => Promise.resolve(tropeLabels[tropeType][tropeIndex]),
    [tropeType, tropeIndex],
  );

  return <PlayView {...{ verses, audioSource, audioLabels, navigation }} forceLinebreakVerses />;
};
