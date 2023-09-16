export function loadSound(soundName) {
  return new Promise((resolve, reject) => {
    const audio = new Audio(require(`../data/audio/${soundName}.mp3`));
    audio.addEventListener("canplaythrough", () =>
      resolve(makeSoundObj(audio))
    );
    audio.addEventListener("error", (ev) => reject(ev.error));
  });
}

function makeSoundObj(audio) {
  const abort = new AbortController();
  return {
    getCurrentTime(cb) {
      cb(audio.currentTime);
    },
    get currentTime() {
      return audio.currentTime;
    },
    set currentTime(currentTime) {
      audio.currentTime = currentTime;
    },
    setCurrentTime(time) {
      audio.currentTime = time;
    },
    play(cb) {
      audio
        .play()
        .then(
          () => true,
          () => false
        )
        .then(cb);
    },
    addTimeupdateListener(func) {
      audio.addEventListener(
        "timeupdate",
        () => {
          func(audio.currentTime);
        },
        { signal: abort.signal }
      );
    },
    pause() {
      audio.pause();
    },
    release() {
      abort.abort();
      if (audio) audio.pause();
      audio = null;
    },
  };
}

export function loadLabel(labelName) {
  return import(
    /* webpackMode: "lazy-once", webpackPreload: true */
    `../data/torah/labels/${labelName}.txt`
  ).then(({ default: contents }) => contents);
}
