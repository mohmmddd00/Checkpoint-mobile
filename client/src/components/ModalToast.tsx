import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text } from "react-native";

interface ModalToastProps {
  message: string | null;
  onHide: () => void;
  duration?: number;
}

export function ModalToast({ message, onHide, duration = 3000 }: ModalToastProps) {
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!message) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();

    timeoutRef.current = setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: -80,
        duration: 300,
        useNativeDriver: true,
      }).start(() => onHide());
    }, duration);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [message]);

  if (!message) return null;

  return (
    <Animated.View
      style={[styles.toastBanner, { transform: [{ translateY: slideAnim }] }]}
      pointerEvents="none"
    >
      <Text style={styles.toastBannerText}>⚠ {message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastBanner: {
    position: "absolute",
    top: 52,
    left: 20,
    right: 20,
    backgroundColor: "#2A0610",
    borderWidth: 1,
    borderColor: "rgba(158,27,50,0.7)",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    zIndex: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 20,
  },
  toastBannerText: {
    color: "#E6A1B0",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
});