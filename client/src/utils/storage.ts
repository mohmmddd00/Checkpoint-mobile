import AsyncStorage from "@react-native-async-storage/async-storage";

export const storage = {
  getToken: () => AsyncStorage.getItem("token"),
  setToken: (token: string) => AsyncStorage.setItem("token", token),
  removeToken: () => AsyncStorage.removeItem("token"),
};