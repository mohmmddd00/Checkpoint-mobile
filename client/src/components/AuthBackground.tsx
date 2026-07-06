import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Pattern, Rect, Circle, Line } from 'react-native-svg';

export function AuthBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['#0D0204', '#1a0308', '#32050F']}
        locations={[0, 0.45, 1]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Svg
        width="100%"
        height="100%"
        style={[StyleSheet.absoluteFill, { opacity: 0.18 }]}
      >
        <Defs>
          <Pattern
            id="cp-controller-tile"
            x="0"
            y="0"
            width="80"
            height="80"
            patternUnits="userSpaceOnUse"
          >
            <Rect x="38" y="36" width="4" height="4" rx="1" fill="none" stroke="#9E1B32" strokeWidth="0.8" rotation="45" originX="40" originY="38" />
            <Rect x="12" y="28" width="12" height="16" rx="5" fill="none" stroke="#9E1B32" strokeWidth="0.7" />
            <Rect x="56" y="28" width="12" height="16" rx="5" fill="none" stroke="#9E1B32" strokeWidth="0.7" />
            <Rect x="24" y="30" width="32" height="12" rx="3" fill="none" stroke="#9E1B32" strokeWidth="0.7" />
            <Rect x="17" y="32" width="5" height="2" rx="0.5" fill="#9E1B32" opacity="0.7" />
            <Rect x="19" y="30" width="2" height="5" rx="0.5" fill="#9E1B32" opacity="0.7" />
            <Circle cx="63" cy="31" r="1.2" fill="#9E1B32" opacity="0.7" />
            <Circle cx="66" cy="33" r="1.2" fill="#9E1B32" opacity="0.7" />
            <Circle cx="63" cy="35" r="1.2" fill="#9E1B32" opacity="0.7" />
            <Circle cx="60" cy="33" r="1.2" fill="#9E1B32" opacity="0.7" />
            <Line x1="0" y1="0" x2="4" y2="0" stroke="#5a1020" strokeWidth="0.5" />
            <Line x1="0" y1="0" x2="0" y2="4" stroke="#5a1020" strokeWidth="0.5" />
            <Line x1="80" y1="80" x2="76" y2="80" stroke="#5a1020" strokeWidth="0.5" />
            <Line x1="80" y1="80" x2="80" y2="76" stroke="#5a1020" strokeWidth="0.5" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#cp-controller-tile)" />
      </Svg>

      <LinearGradient
        colors={['transparent', 'rgba(13,2,4,0.82)']}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}