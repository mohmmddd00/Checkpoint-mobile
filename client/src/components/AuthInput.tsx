import { useState } from 'react';
import { TextInput, StyleSheet } from 'react-native';
import type { TextInputProps, ViewStyle } from 'react-native';

interface AuthInputProps extends TextInputProps {
  containerStyle?: ViewStyle;
}

export function AuthInput({ containerStyle, style, ...rest }: AuthInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      {...rest}
      onFocus={(e) => {
        setFocused(true);
        rest.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        rest.onBlur?.(e);
      }}
      placeholderTextColor="rgba(255,255,255,0.4)"
      style={[
        styles.input,
        focused ? styles.inputFocused : styles.inputBlurred,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    width: '100%',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
    color: 'white',
    fontSize: 15,
  },
  inputBlurred: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  inputFocused: {
    borderWidth: 1,
    borderColor: 'rgba(158,27,50,0.7)',
    backgroundColor: 'rgba(158,27,50,0.08)',
  },
});