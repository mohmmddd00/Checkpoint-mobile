import Toast from "react-native-toast-message";

export const cpToast = {
  success: (message: string) =>
    Toast.show({
      type: "cpSuccess",
      text1: message,
      position: "top",
      visibilityTime: 3000,
    }),

  error: (message: string) =>
    Toast.show({
      type: "cpError",
      text1: message,
      position: "top",
      visibilityTime: 4000,
    }),
};