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
