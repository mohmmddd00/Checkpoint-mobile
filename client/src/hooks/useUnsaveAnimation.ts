import { useState } from "react";

type AnimationState = "idle" | "unfilling" | "leaving";

export function useUnsaveAnimation(onComplete: () => void) {
  const [state, setState] = useState<AnimationState>("idle");

  const trigger = () => {
    if (state !== "idle") return;
    // Phase 1: floppy becomes unfilled instantly (handled by saved=false)
    setState("unfilling");
    // Phase 2: after a short pause, card flies out
    setTimeout(() => {
      setState("leaving");
      // Phase 3: after animation completes, remove from list
      setTimeout(() => {
        onComplete();
      }, 400);
    }, 200);
  };

  return { animState: state, trigger };
}