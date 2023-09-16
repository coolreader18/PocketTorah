/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Button,
  Modal,
} from 'react-native';
import Slider from '@react-native-community/slider';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import maftirOffset from '../data/maftirOffset.json';
import { HDate, HebrewCalendar, parshiot as hebcalParshiot } from '@hebcal/core';
import * as hebcal from '@hebcal/core';
import { getLeyningOnDate, getLeyningForParsha } from '@hebcal/leyning';
import * as leyning from '@hebcal/leyning';

// Import Texts
const Amos = () => import('../data/torah/json/Amos.json').then(mod => mod.default);
const Deuteronomy = () => import('../data/torah/json/Deuteronomy.json').then(mod => mod.default);
const Exodus = () => import('../data/torah/json/Exodus.json').then(mod => mod.default);
const Ezekiel = () => import('../data/torah/json/Ezekiel.json').then(mod => mod.default);
const Genesis = () => import('../data/torah/json/Genesis.json').then(mod => mod.default);
const Hosea = () => import('../data/torah/json/Hosea.json').then(mod => mod.default);
const Isaiah = () => import('../data/torah/json/Isaiah.json').then(mod => mod.default);
const Jeremiah = () => import('../data/torah/json/Jeremiah.json').then(mod => mod.default);
const Joel = () => import('../data/torah/json/Joel.json').then(mod => mod.default);
const Joshua = () => import('../data/torah/json/Joshua.json').then(mod => mod.default);
const Judges = () => import('../data/torah/json/Judges.json').then(mod => mod.default);
const Kings_1 = () => import('../data/torah/json/Kings_1.json').then(mod => mod.default);
const Kings_2 = () => import('../data/torah/json/Kings_2.json').then(mod => mod.default);
const Leviticus = () => import('../data/torah/json/Leviticus.json').then(mod => mod.default);
const Malachi = () => import('../data/torah/json/Malachi.json').then(mod => mod.default);
const Micah = () => import('../data/torah/json/Micah.json').then(mod => mod.default);
const Numbers = () => import('../data/torah/json/Numbers.json').then(mod => mod.default);
const Obadiah = () => import('../data/torah/json/Obadiah.json').then(mod => mod.default);
const Samuel_1 = () => import('../data/torah/json/Samuel_1.json').then(mod => mod.default);
const Samuel_2 = () => import('../data/torah/json/Samuel_2.json').then(mod => mod.default);
const Zechariah = () => import('../data/torah/json/Zechariah.json').then(mod => mod.default);

// Import Translations
const GenesisTrans = () => import('../data/torah/translation/Genesis.json').then(mod => mod.default);
const ExodusTrans = () => import('../data/torah/translation/Exodus.json').then(mod => mod.default);
const DeuteronomyTrans = () => import('../data/torah/translation/Deuteronomy.json').then(mod => mod.default);
const LeviticusTrans = () => import('../data/torah/translation/Leviticus.json').then(mod => mod.default);
const NumbersTrans = () => import('../data/torah/translation/Numbers.json').then(mod => mod.default);
const IsaiahTrans = () => import('../data/torah/translation/Isaiah.json').then(mod => mod.default);
const JoshuaTrans = () => import('../data/torah/translation/Joshua.json').then(mod => mod.default);
const JudgesTrans = () => import('../data/torah/translation/Judges.json').then(mod => mod.default);
const MalachiTrans = () => import('../data/torah/translation/Malachi.json').then(mod => mod.default);
const ObadiahTrans = () => import('../data/torah/translation/Obadiah.json').then(mod => mod.default);
const Samuel_1Trans = () => import('../data/torah/translation/Samuel_1.json').then(mod => mod.default);
const Samuel_2Trans = () => import('../data/torah/translation/Samuel_2.json').then(mod => mod.default);
const ZechariahTrans = () => import('../data/torah/translation/Zechariah.json').then(mod => mod.default);
const JoelTrans = () => import('../data/torah/translation/Joel.json').then(mod => mod.default);
const JeremiahTrans = () => import('../data/torah/translation/Jeremiah.json').then(mod => mod.default);
const HoseaTrans = () => import('../data/torah/translation/Hosea.json').then(mod => mod.default);
const EzekielTrans = () => import('../data/torah/translation/Ezekiel.json').then(mod => mod.default);
const AmosTrans = () => import('../data/torah/translation/Amos.json').then(mod => mod.default);
const Kings_2Trans = () => import('../data/torah/translation/Kings_2.json').then(mod => mod.default);
const Kings_1Trans = () => import('../data/torah/translation/Kings_1.json').then(mod => mod.default);

const bookMap = {
  Amos,
  Deuteronomy,
  Exodus,
  Ezekiel,
  Genesis,
  GenesisTrans,
  IsaiahTrans,
  ExodusTrans,
  DeuteronomyTrans,
  LeviticusTrans,
  NumbersTrans,
  JoshuaTrans,
  JudgesTrans,
  MalachiTrans,
  ObadiahTrans,
  Samuel_1Trans,
  Samuel_2Trans,
  ZechariahTrans,
  JoelTrans,
  JeremiahTrans,
  HoseaTrans,
  EzekielTrans,
  AmosTrans,
  Kings_2Trans,
  Kings_1Trans,
  Hosea,
  Isaiah,
  Jeremiah,
  Joel,
  Joshua,
  Judges,
  Kings_1,
  Kings_2,
  Leviticus,
  Malachi,
  Micah,
  Numbers,
  Obadiah,
  Samuel_1,
  Samuel_2,
  Zechariah,
};

import { loadSound, loadLabel } from "./assets";


class CustomButton extends React.Component {
  render() {
    return (
      <TouchableOpacity onPress={this.props.doOnPress} style={this.props.style ? this.props.style : null} >
        <Text style={styles.button}>
          {this.props.buttonTitle}
        </Text>
      </TouchableOpacity>
    );
  }
}

class FooterButton extends React.Component {
  render() {
    return (
      <TouchableOpacity onPress={this.props.doOnPress} style={this.props.style ? this.props.style : null} >
        <Text style={styles.footerButtonInner}>
          {this.props.buttonTitle}
        </Text>
      </TouchableOpacity>
    );
  }
}

const parshaNameMap = {
  "Beha'alotcha": 'Beha’alotcha',
  "Sh'lach": 'Sh’lach',
  Vaetchanan: 'Va’ethanan',
  "Re'eh": 'Re’eh',
  "Ha'Azinu": 'Haazinu',
};

const haftAlias = {
  'I Kings': 'Kings_1',
  'II Kings': 'Kings_2',
  'I Samuel': 'Samuel_1',
  'II Samuel': 'Samuel_2',
};

function hebcalReadingToInternalFormat(/** @type {leyning.Leyning} */ reading) {
  const haft = Array.isArray(reading.haft) ? reading.haft : [reading.haft];
  const name = reading.name.en;
  const aliyot = [];
  for (const [num, aliyah] of Object.entries(reading.fullkriyah)) {
    aliyot.push({
      _num: num,
      _begin: aliyah.b,
      _end: aliyah.e,
      _numverses: aliyah.v,
    });
  }
  const haftaraStr = haft
    .map(a => {
      const book = haftAlias[a.k] || a.k;
      return `${book} ${a.b} - ${a.e}`;
    })
    .join('; ');
  const displayName = parshaNameMap[name] || name;
  const parshahLookup = {
    _id: displayName,
    _haftara: haftaraStr,
    _haftaraLength: reading.haftaraNumV,
    _verse: reading.summary.replace(/-/g, ' - '),
    _hebrew: reading.name.he,
    maftirOffset: maftirOffset[displayName],
    fullkriyah: {
      aliyah: aliyot,
    },
  };
  if (reading.sephardic) {
    parshahLookup._sephardic = reading.sephardic;
  }
  if (haft.length > 1) {
    const numvPart2 = haft[1].v;
    parshahLookup._haftaraLength2 = numvPart2;
    parshahLookup._haftaraLength -= numvPart2;
  }
  return parshahLookup;
}

class HomeScreen extends React.Component {
  render() {
    const { navigate } = this.props.navigation;

    //figure out current parshah
    const today = new HDate();
    // const hdate = new HDate(28, 'Tamuz', 5795);
    // const hdate = new HDate(19, 'Tishrei', 5783);
    const saturday = today.onOrAfter(6);
    // const sedra = HebrewCalendar.getSedra(hyear, il);
    const reading = getLeyningOnDate(saturday, false);
    // const parshahLookup = hebcalReadingToInternalFormat(reading);
    //</end current parshah lookup>
    // console.log(parshahLookup);

    return (
      <ScrollView>
        <CustomButton doOnPress={() => navigate('TorahReadingsScreen')} buttonTitle="List of Torah Readings" />
        <CustomButton doOnPress={() => navigate('AliyahSelectScreen', { parshah: reading.name.en })}  buttonTitle="This Week's Torah Readings" />
        <CustomButton doOnPress={() => navigate('About')} buttonTitle="About this App" />
      </ScrollView>
    );
  }
}

class AboutScreen extends React.Component {
  render() {
    return (
      <View style={styles.aboutPage}>
        <Text style={styles.aboutPageText}>PocketTorah is a labor of love maintained by Russel Neiss & Charlie Schwartz.</Text>
        <Text style={styles.aboutPageText}>Initially funded by the Jewish New Media Innovation Fund, PocketTorah is designed to help you learn the weekly Torah and Haftarah portions anywhere, at any time, for free.</Text>
        <Text style={styles.aboutPageText}>If you like it, or find it useful, please consider making a donation to the Jewish charity of your choice.</Text>
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
}

class TorahReadingsScreen extends React.Component {
  render() {

    //create button for each parsha
    var content = hebcalParshiot.map((parshah) => (<CustomButton key={parshah} doOnPress={() => navigate('AliyahSelectScreen', { parshah })} buttonTitle={parshah} />) );

    const { navigate } = this.props.navigation;
    return (
      <View>
        <ScrollView>
          {content}
        </ScrollView>
      </View>
    );
  }
}

class AliyahSelectScreen extends React.Component {
  render() {
    const { navigate } = this.props.navigation;
    const reading = getLeyningForParsha(this.props.route.params.parshah);
    const readings = [
      ...Object.entries(reading.fullkriyah).map(([num, aliyah]) => ({
        num,
        buttonTitle:
          num != "M"
            ? `Aliyah ${num}: ${aliyah.b}-${aliyah.e}`
            : `Maftir Aliyah: ${aliyah.b}-${aliyah.e}`,
      })),
      { num: "H", buttonTitle: `Haftarah: ${reading.haftara}` },
    ];
    const content = readings.map(({ num, buttonTitle }) => (
      <CustomButton
        key={num}
        doOnPress={() =>
          navigate("PlayViewScreen", {
            parshah: reading.name.en,
            aliyah: num,
          })
        }
        buttonTitle={buttonTitle}
      />
    ));
    return <ScrollView>{content}</ScrollView>;
  }
}


class PlayViewScreen extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      audio: null,
      labels: null,
      texts: null,
      activeWordIndex:0,
      audioPlaying: false,
      translationOn: false,
      tikkunOn: false,
      modalVisible: false,
      textSizeMultiplier: 1,
      currentAudioTime: 0,
    };
    this.changeAudioTime = this.changeAudioTime.bind(this);

  }

  getMaftirWordOffset() {
    const { parshah, aliyah } = this.props.route.params;
    return aliyah === "M" ? maftirOffset[parshaNameMap[parshah] || parshah] : 0;
  }

  toggleAudio(action) {
    action ??= this.state.audioPlaying ? 'pause' : 'play';
    if (action == 'play') {
      const maftirWordOffset = this.getMaftirWordOffset();
      if (maftirWordOffset > 0 && this.state.audio.currentTime == 0) {
        this.changeAudioTime(maftirWordOffset);
      }

      this.state.audio.play((success) => {
        if (success) {
          console.log("successfully finished playing");
        } else {
          console.log("playback failed due to audio decoding errors");
        }
      });
      this.setState({ audioPlaying: true });


    }
    else {
      this.state.audio.pause();
      this.setState({audioPlaying: false});
    }
  }

  changeAudioTime(wordIndex){
    if (!this.state.audio || !this.state.labels ) { return }
    this.toggleAudio('pause');
    var newTime = this.state.labels[wordIndex];
    this.state.audio.setCurrentTime(newTime);
    this.setState({ activeWordIndex: wordIndex, currentAudioTime: newTime });
    this.toggleAudio('play');
  }

  toggleTranslation(action) {
    const translationOn = action ? action == 'on' : !this.state.translationOn;
    this.setState({ translationOn });
  }

  toggleSettingsModal(action) {
    if (action == 'open') {
      this.setState({modalVisible: true});
    }
    else {
      this.setState({modalVisible: false});
    }
  }

  toggleTikkun(action) {
    const tikkunOn = action ? action == "on" : !this.state.tikkunOn;
    this.setState({ tikkunOn });
  }

  /** @typedef {import("@hebcal/leyning").Aliyah} Aliyah */
  
  /** @returns {[Aliyah, Aliyah?]} */
  getAliyah() {
    const { params } = this.props.route;
    const reading = getLeyningForParsha(params.parshah)
    const aliyah = params.aliyah === "H" ? reading.haft : reading.fullkriyah[params.aliyah];
    return Array.isArray(aliyah) ? aliyah : [aliyah];
  }


  componentDidMount() {
    this.props.navigation.setOptions({
      headerRight: () => (
        <View style={{ marginRight: "5px" }}>
          <Button
            title={"Settings"}
            onPress={() => this.toggleSettingsModal("open")}
          />
        </View>
      ),
    });
    const maftirWordOffset = this.getMaftirWordOffset();
    if (maftirWordOffset > 0) {
      this.setState({ activeWordIndex: maftirWordOffset });
    }
    var { params } = this.props.route;
    const mappedName = parshaNameMap[params.parshah] || params.parshah;
    const title =
      mappedName + "-" + (params.aliyah === "M" ? "7" : params.aliyah);
    loadSound(title)
      .then((audio) => {
        audio.addTimeupdateListener((currentAudioTime) => {
          this.setState({ currentAudioTime });
        });
        this.setState({ audio });
      }, (error) => {
        console.log('failed to load the sound', error);
      });


    loadLabel(title)
      .then((contents) => {
        // log the file contents
        this.setState({
          labels: contents.split(',').map(parseFloat),
        });

      })
      .catch((err) => {
        console.log(err.message, err.code);
      });
    
    const aliyah = this.getAliyah()[0];
    const originatingBook = haftAlias[aliyah.k] || aliyah.k

    Promise.all([
      bookMap[originatingBook](),
      bookMap[originatingBook + "Trans"],
    ])
      .then(([book, bookTrans]) => {
        this.setState({ texts: { book: book.Tanach.tanach.book, bookTrans } });
      })
      .catch((err) => {
        console.log(err);
      });
  }

  componentWillUnmount() {
    if (this.state.audio) this.state.audio.release();
  }
  render() {
    // const aliyah = useMemo(() => {
    //   const { params } = this.props.route;
    //   const reading = getLeyningForParsha(params.parshah);
    //   const aliyah =
    //     params.aliyah === "H"
    //       ? reading.haft
    //       : reading.fullkriyah[params.aliyah];
    //   return Array.isArray(aliyah) ? aliyah : [aliyah];
    // }, [this.props.route.params.parshah, this.props.route.params.aliyah]);

    // var { params } = this.props.route;
    // const mappedName = parshaNameMap[params.parshah] || params.parshah;
    // const title =
    //   mappedName + "-" + (params.aliyah === "M" ? "7" : params.aliyah);

    // const audio = useAudio(title);


    if (!this.state.audio || !this.state.labels || !this.state.texts) {
    return (
      <View>
        <ActivityIndicator
          size="large"
        />
        <Text>Loading....</Text>
      </View>
    );

    }

    else {
      var wordFontSize = 24*parseFloat(this.state.textSizeMultiplier);
      var stamFontSize = 20*parseFloat(this.state.textSizeMultiplier);

      return (
        <View style={{flex: 1, maxHeight: '100%' }}>
        <Modal
          animationType={"slide"}
          transparent={false}
          visible={this.state.modalVisible}
          onRequestClose={() => {console.log("Modal has been closed.")}}
          >
         <View style={{marginTop: 22}}>
          <View>
              <Text style={styles.modalHeader}>Settings</Text>
            <View style={styles.modalSection}>
              <Text>Font Size:</Text>
              <Slider minimumValue={.5} maximumValue={2} value={this.state.textSizeMultiplier} onSlidingComplete={(value) => this.setState({textSizeMultiplier: value})} />
              <Text style={[styles.word,{fontSize: wordFontSize}]}>בְּרֵאשִׁ֖ית </Text>
              <Text style={[styles.stam,{fontSize: stamFontSize}]}>בראשית </Text>
            </View>
            <View style={styles.modalSection}>
              <Text>Set Audio Speed:</Text>
              <Slider minimumValue={.5} maximumValue={2} value={1} onValueChange={(value) => this.state.audio.setSpeed(value)} />
            </View>

            <View style={styles.modalFooter}>
              <CustomButton doOnPress={() => this.toggleSettingsModal('close')} buttonTitle="Save Settings" />
            </View>

          </View>
         </View>
        </Modal>
          <ScrollView style={{flex: 1}} contentContainerStyle={{ paddingHorizontal: "5px" }}>
            <Verses
              changeAudioTime={this.changeAudioTime}
              translationFlag={this.state.translationOn}
              tikkunFlag={this.state.tikkunOn}
              textSizeMultiplier={this.state.textSizeMultiplier}
              currentAudioTime={this.state.currentAudioTime}
              activeWordIndex={this.state.activeWordIndex}
              labels={this.state.labels}
              maftirWordOffset={this.getMaftirWordOffset()}
              book={this.state.texts.book}
              transBook={this.state.texts.transBook}
              aliyah={this.getAliyah()}
            />
          </ScrollView>
          <View style={styles.footer}>
            <FooterButton style={styles.footerButton} doOnPress={() => this.toggleAudio()} buttonTitle={ this.state.audioPlaying ?"Pause":"Play"} /> 
            <FooterButton style={styles.footerButton} doOnPress={() => this.toggleTranslation()} buttonTitle={this.state.translationOn ? "Translation Off" : "Translation On"} />
            <FooterButton style={styles.footerButton} doOnPress={() => this.toggleTikkun()} buttonTitle={this.state.tikkunOn ? "Tikkun Off" : "Tikkun On"} />
          </View>
        </View>
      );
    }
  }
}

function useAudio(title) {
  const [audio, setAudio] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [currentAudioTime, setCurrentAudioTime] = useState(0);
  useEffect(() => {
    let ignore = false;
    loadSound(title).then(
      (audio) => {
        if (ignore) return;
        audio.addTimeupdateListener(setCurrentAudioTime);
        setAudio(audio);
      },
      (error) => {
        console.log("failed to load the sound", error);
      }
    );
    return () => {
      ignore = true;
      if (audio) audio.release();
    };
  }, [title]);
  return audio && {
    currentAudioTime,
    setCurrentAudioTime: (time) => {
      setCurrentAudioTime(time);
      audio.currentTime = time;
    },
    playing,
    play: () => {
      setPlaying(true);
      audio.play();
    },
    pause: () => {
      setPlaying(false);
      audio.pause();
    },
  };
}

/** @returns {[number, number]} */
function parseChV(s) {
  const [ch, v] = s.split(":");
  return [parseInt(ch) - 1, parseInt(v) - 1]
}

/** @param {{ aliyah: [Aliyah, Aliyah?], translationFlag: boolean }>} props */
function Verses({
  aliyah,
  book,
  transBook,
  translationFlag,
  labels,
  maftirWordOffset,
  changeAudioTime,
  activeWordIndex,
  textSizeMultiplier,
  currentAudioTime,
}) {
  const verseText = [];
  const addVerses = (/** @type {Aliyah} */ aliyah) => {
    let lastWordIndex = 0;
    let [curChapter, curVerse] = parseChV(aliyah.b);
    const [endChapter, endVerse] = parseChV(aliyah.e);
    while (!(curChapter == endChapter && curVerse == endVerse)) {
      if (!book.c[curChapter].v[curVerse]) {
        curChapter = curChapter + 1;
        curVerse = 0;
      }
      const verse = book.c[curChapter].v[curVerse];
      verseText.push(
        <Verse
          {...this.props}
          labels={labels}
          verse={verse}
          curWordIndex={lastWordIndex}
          chapterIndex={curChapter}
          verseIndex={curVerse}
          maftirWordOffset={maftirWordOffset}
          changeAudioTime={changeAudioTime}
          activeWordIndex={activeWordIndex}
          textSizeMultiplier={textSizeMultiplier}
          currentAudioTime={currentAudioTime}
          key={`${curChapter}:${curVerse}`}
        />
      );
      if (translationFlag) {
        verseText.push(
          <Text
            key={`translation${curChapter}:${curVerse}`}
            style={{ paddingHorizontal: "5px" }}
          >
            {transBook.text[curChapter][curVerse]}
          </Text>
        );
      }

      lastWordIndex += verse.w.length;
      curVerse++;
    }
  };
  addVerses(aliyah[0]);
  if (aliyah[1]) addVerses(aliyah[1]);

  return translationFlag ? <View>{verseText}</View> : <Text>{verseText}</Text>;
}

function Verse(props) {
  const {
    tikkunFlag,
    labels,
    currentAudioTime,
    changeAudioTime,
    textSizeMultiplier,
    curWordIndex,
    chapterIndex,
    verseIndex,
    maftirWordOffset,
    verse,
  } = props;
  const fontSize = (tikkunFlag ? 30 : 36) * textSizeMultiplier;
  const wordStyle = tikkunFlag ? styles.stam : styles.word;
  const deleteRegex = tikkunFlag ? /[\/\u0591-\u05C7]/g : /\//g;
  var words = verse.w.map((word, i) => {
    const wordIndex = curWordIndex + i + maftirWordOffset;
    const active =
      labels[wordIndex] < currentAudioTime &&
      labels[wordIndex + 1] > currentAudioTime;
    const wordElem = (
      <Text style={[wordStyle, active && styles.active, { fontSize }]}>
        {word.replace(deleteRegex, "")}
      </Text>
    );
    return (
      <TouchableOpacity
        key={wordIndex}
        onPress={() => {
          changeAudioTime(wordIndex);
        }}
      >
        {i == 0 ? (
          <Text>
            <Text style={styles.verseNum}>
              {chapterIndex + 1}:{verseIndex + 1}
            </Text>
            {wordElem}
          </Text>
        ) : (
          wordElem
        )}
      </TouchableOpacity>
    );
  });

  return <Text>{words}</Text>;
}

// const PocketTorah = StackNavigator({
//   Home: { screen: HomeScreen },
//   About: { screen: AboutScreen },
//   TorahReadingsScreen: { screen: TorahReadingsScreen },
//   AliyahSelectScreen: { screen: AliyahSelectScreen },
//   PlayViewScreen: { screen: PlayViewScreen },
// });


const Stack = createStackNavigator();

// /** @type {import("@react-navigation/native").LinkingOptions} */
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
     <Stack.Screen name="AliyahSelectScreen" component={AliyahSelectScreen} options={({ route }) => ({ title: `${route.params.parshah}`, })} />
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    top: 30,
  },
  header: {
    fontSize: 20,
    textAlign: 'center',
    marginTop: 20,
    marginRight: 10,
    marginLeft: 10,
    marginBottom: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  button: {
    margin: 10,
    padding: 10,
    backgroundColor: '#ccc',
    textAlign: 'center',
  },

  word: {
    flex:0,
    padding: 4,
    fontFamily: "Taamey Frank Taamim Fix",
  },
  stam: {
    flex:0,
    padding: 4,
    fontFamily: "Stam Ashkenaz CLM",
  },
  active: {
    backgroundColor: '#ffff9d',
  },
  footer: {
    flexDirection:'row',
    alignItems: 'stretch',
    alignContent: 'stretch',
  },
  footerButton: {
    flexGrow: 1,
    width: 10,
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#efeff2',
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: '#d9d9de',

  },
  footerButtonInner: {
    fontSize: 12,
    textAlign: 'center',
  },
  verseNum: {
    paddingTop: 10,
    fontSize: 10,
    verticalAlign: 'top',
  },
  modalHeader: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalSection: {
    borderColor: '#d9d9de',
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
