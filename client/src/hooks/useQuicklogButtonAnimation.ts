import { useRef, useEffect } from "react";
import { Animated } from "react-native";

export function useQuicklogButtonAnimation(isActive: boolean) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const isMounted = useRef(false);

  useEffect(() => {
    // First render: only animate if this is the QuickLog screen mounting
    if (!isMounted.current) {
      isMounted.current = true;
      if (isActive) {
        scaleAnim.setValue(0.4);
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 320,
            friction: 10,
          }),
          Animated.spring(rotateAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 320,
            friction: 10,
          }),
        ]).start();
      }
      return;
    }

    // Subsequent changes (handles shared-layout architecture too)
    Animated.parallel([
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.6,
          duration: 70,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 320,
          friction: 10,
        }),
      ]),
      Animated.spring(rotateAnim, {
        toValue: isActive ? 1 : 0,
        useNativeDriver: true,
        tension: 320,
        friction: 10,
      }),
    ]).start();
  }, [isActive]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });

  return {
    iconAnimStyle: {
      transform: [{ scale: scaleAnim }, { rotate }],
    },
  };
}