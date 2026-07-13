import { useRef, useState, useCallback } from "react";
import { Animated } from "react-native";

export function usePfpExpandAnimation() {
  const [isOpen, setIsOpen] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const imageScale = useRef(new Animated.Value(0.65)).current;

  const open = useCallback(() => {
    setIsOpen(true);
    overlayOpacity.setValue(0);
    imageScale.setValue(0.65);
    Animated.parallel([
      Animated.timing(overlayOpacity, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.spring(imageScale, { toValue: 1, tension: 140, friction: 9, useNativeDriver: true }),
    ]).start();
  }, [overlayOpacity, imageScale]);

  const close = useCallback(() => {
    Animated.parallel([
      Animated.timing(overlayOpacity, { toValue: 0, duration: 130, useNativeDriver: true }),
      Animated.timing(imageScale, { toValue: 0.65, duration: 130, useNativeDriver: true }),
    ]).start(() => setIsOpen(false));
  }, [overlayOpacity, imageScale]);

  return { isOpen, open, close, overlayOpacity, imageScale };
}