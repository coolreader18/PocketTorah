import { Platform } from "react-native";

const isAndroid = Platform.OS == "android";

const RNFS = require("react-native-fs");

// Import the react-native-sound module
var Sound = require("react-native-sound");

// Enable playback in silence mode (iOS only)
Sound.setCategory("Playback");

export function loadSound(soundName) {
  return new Promise((resolve, reject) => {
    var audioFileName = "audio/" + soundName + ".mp3";
    if (isAndroid) audioFileName = "asset:/" + audioFileName;
    var audio = new Sound(audioFileName, Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        reject(error);
      } else {
        const intervalIds = [];
        audio.addTimeUpdateListener = function (func) {
          intervalIds.push(setInterval(() => this.getCurrentTime(func), 50));
        };
        audio.release = function () {
          intervalIds.forEach(clearInterval);
          super.release();
        };
        Object.defineProperties(audio, {
          currentTime: {
            get: () => {
              let currentTime;
              audio.getCurrentTime((ct) => {
                currentTime = ct;
              });
              return currentTime;
            },
            set: (currentTime) => {
              audio.setCurrentTime(currentTime);
            },
          },
        });
        resolve(audio);
      }
    });
  });
}

const basePath = isAndroid ? "" : RNFS.MainBundlePath + "/";
const readAsset = isAndroid ? RNFS.readFileAssets : RNFS.readFile;
export function loadLabel(labelName) {
  return readAsset(basePath + "labels/" + labelName + ".txt");
}
