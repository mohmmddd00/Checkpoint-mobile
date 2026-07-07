import { useRef, useState } from "react";
import { Animated } from "react-native";

type AnimationState = "idle" | "unfilling" | "leaving";

export function useUnsaveAnimation(onComplete: () => void) {
  const [state, setState] = useState<AnimationState>("idle");
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const maxHeight = useRef(new Animated.Value(600)).current;

  const trigger = () => {
    if (state !== "idle") return;
    setState("unfilling");

    setTimeout(() => {
      setState("leaving");
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 400,
          duration: 400,
          useNativeDriver: false,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: false,
        }),
        Animated.timing(maxHeight, {
          toValue: 0,
          duration: 400,
          useNativeDriver: false,
        }),
      ]).start(() => {
        onComplete();
      });
    }, 200);
  };

  return { animState: state, trigger, translateX, opacity, maxHeight };
}