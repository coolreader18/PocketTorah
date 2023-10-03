import { NavigationProp, ParamListBase } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import React, { MutableRefObject, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

export const platformSelect = <T>(plats: { [k in Platform["OS"]]?: T }, default_: T): T =>
  Platform.OS in plats ? plats[Platform.OS]! : default_;

export interface ExteriorPromise<T> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
}

export function exteriorPromise<T>(): ExteriorPromise<T> {
  let resolve!: ExteriorPromise<T>["resolve"], reject!: ExteriorPromise<T>["reject"];
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

export function usePromise<T>(
  getProm: () => Promise<T>,
  dependencies: React.DependencyList,
): T | null {
  const [result, setResult] = useState<T | null>(null);
  useEffect(() => {
    let ignore = false;
    getProm()
      .then((result) => {
        if (!ignore) setResult(result);
      })
      .catch((err) => console.error(err));
    return () => {
      ignore = true;
    };
  }, dependencies);
  return result;
}

export function useScreenOptions<ScreenOptions extends {}>(
  navigation: NavigationProp<any, any, any, any, ScreenOptions>,
  options: Partial<ScreenOptions> | (() => Partial<ScreenOptions>),
  deps: React.DependencyList = [],
) {
  useEffect(() => {
    navigation.setOptions(typeof options === "function" ? options() : options);
  }, [navigation, ...deps]);
}

export function useScreenTitle(
  navigation: NavigationProp<any, any, any, any, { title: string }>,
  title: string,
) {
  useScreenOptions(navigation, { title }, [title]);
}
