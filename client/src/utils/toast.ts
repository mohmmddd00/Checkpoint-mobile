import Toast from "react-native-toast-message";

export const cpToast = {
  success: (message: string) =>
    Toast.show({
      type: "success",
      text1: message,
      position: "bottom",
      visibilityTime: 3000,
      props: {
        style: {
          backgroundColor: "#160408",
          borderColor: "#2e0a12",
        },
      },
    }),

  error: (message: string) =>
    Toast.show({
      type: "error",
      text1: message,
      position: "bottom",
      visibilityTime: 4000,
      props: {
        style: {
          backgroundColor: "#160408",
          borderColor: "#5c0f1e",
        },
      },
    }),
};