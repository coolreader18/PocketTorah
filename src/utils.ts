import { Platform } from "react-native";

export const platformSelect = <T>(
  plats: { [k in Platform["OS"]]?: T },
  default_: T,
): T => (Platform.OS in plats ? plats[Platform.OS]! : default_);
