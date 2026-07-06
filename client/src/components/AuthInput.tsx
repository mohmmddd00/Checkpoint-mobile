import { useState } from "react";
import type { InputHTMLAttributes } from "react";

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  // All standard input props (type, placeholder, value, onChange, required, id, etc.)
  // are passed straight through — no logic lives here, only styling.
  containerStyle?: React.CSSProperties;
}

export function AuthInput({ containerStyle, style, ...rest }: AuthInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <input
      {...rest}
      onFocus={(e) => {
        setFocused(true);
        rest.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        rest.onBlur?.(e);
      }}
      style={{
        width: "100%",
        boxSizing: "border-box",
        padding: "13px 16px",
        borderRadius: "12px",
        border: focused
          ? "1px solid rgba(158,27,50,0.7)"
          : "1px solid rgba(255,255,255,0.13)",
        background: focused
          ? "rgba(158,27,50,0.08)"
          : "rgba(255,255,255,0.08)",
        color: "white",
        fontSize: "15px",
        outline: "none",
        transition: "border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease",
        boxShadow: focused
            ? "inset 0 1px 0 rgba(255,255,255,0.07)"
            : "inset 0 1px 0 rgba(255,255,255,0.05)",
        ...style,
      }}
    />
  );
}