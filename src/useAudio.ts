import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Audio,
  AVPlaybackStatusSuccess,
  AVPlaybackStatusToSet,
  AVPlaybackStatus,
  AVPlaybackSource,
} from "expo-av";
import { exteriorPromise, ExteriorPromise } from "./utils";

export interface Audio {
  loaded: boolean;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  playing: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  speed: number;
  setSpeed: (speed: number) => void;
}

type AudioMethods = {
  [k in keyof Audio as Audio[k] extends Function ? k : never]: Audio[k];
};

type SetStatusAsync = (status: AVPlaybackStatusToSet) => Promise<AVPlaybackStatus>;

type Status = Pick<AVPlaybackStatusSuccess, "positionMillis" | "isPlaying" | "rate"> & {
  isLoaded: boolean;
};

const defaultStatus = {
  positionMillis: 0,
  isPlaying: false,
  rate: 1,
  isLoaded: false,
};

type UseAudioProps = { speed?: number };
export function useAudio<T extends AVPlaybackSource | null>(
  title: T,
  props?: UseAudioProps,
): T extends AVPlaybackSource ? Audio : null;
export function useAudio(title: AVPlaybackSource | null, props: UseAudioProps = {}): Audio | null {
  const { speed = 1 } = props;
  const audio = useRef<
    | { state: "resolved"; sound: Audio.Sound }
    | { state: "pending"; prom: ExteriorPromise<AVPlaybackStatus>; status: AVPlaybackStatusToSet }
    | undefined
  >();
  const [status, setStatus] = useState<Status>(defaultStatus);
  const setStatusAsync = useCallback<SetStatusAsync>(
    (status) => {
      if (audio.current?.state == "resolved") {
        return audio.current.sound.setStatusAsync(status);
      }
      audio.current ??= { state: "pending", prom: exteriorPromise(), status: {} };
      Object.assign(audio.current.status, status);
      return audio.current.prom.promise;
    },
    [title],
  );
  const isPlaying = useRef(false);
  const methods = useMemo(
    () => makeAudioMethods(setStatusAsync, isPlaying),
    [setStatusAsync, isPlaying],
  );
  useEffect(() => {
    if (!title) return;
    const initialStatus = {
      progressUpdateIntervalMillis: __DEV__ ? 500 : 50,
      shouldCorrectPitch: true,
      pitchCorrectionQuality: Audio.PitchCorrectionQuality.Low,
    };
    Audio.Sound.createAsync(title, initialStatus, async (status) => {
      if (!status.isLoaded) {
        setStatus(defaultStatus);
        if (status.error) console.error(status.error);
        return;
      }
      isPlaying.current = status.isPlaying;
      setStatus(status);
    }).then(async ({ sound }) => {
      if (audio.current?.state === "pending") {
        audio.current.prom.resolve(sound.setStatusAsync(audio.current.status));
      }
      audio.current = { state: "resolved", sound };
    });
    return () => {
      if (audio.current?.state === "resolved") audio.current.sound.unloadAsync();
      audio.current = undefined;
    };
  }, [title]);
  if (title == null) return null;
  useEffect(() => {
    if (audio.current == null && speed === 1) {
      // don't need to do anything
    } else {
      setStatusAsync({ rate: speed });
    }
  }, [setStatusAsync, speed]);
  return {
    loaded: status.isLoaded,
    currentTime: status.positionMillis / 1000,
    playing: status.isPlaying,
    speed: status.rate,
    ...methods,
  };
}

const makeAudioMethods = (
  setStatusAsync: SetStatusAsync,
  isPlaying: { readonly current: boolean },
): AudioMethods => ({
  setCurrentTime: (time: number) =>
    setStatusAsync({ positionMillis: time * 1000, shouldPlay: true }),
  play: () => setStatusAsync({ shouldPlay: true }),
  pause: () => setStatusAsync({ shouldPlay: false }),
  toggle: () => setStatusAsync({ shouldPlay: !isPlaying.current }),
  setSpeed: (speed: number) => setStatusAsync({ rate: speed }),
});
