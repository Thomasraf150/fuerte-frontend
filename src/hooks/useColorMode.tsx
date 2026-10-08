import { useCallback, useEffect } from "react";
import useLocalStorage from "./useLocalStorage";

/**
 * The switch is mounted twice since 2026-10-07 (the top bar from sm, the user menu on phones), and
 * each copy holds its own state: a change announces itself, so the other copy follows. Without it,
 * crossing 640px showed the other switch's knob the wrong way round, and its first tap did nothing.
 */
const CHANGED = "fuerte:color-mode";

const useColorMode = () => {
  const [colorMode, setStoredColorMode] = useLocalStorage("color-theme", "light");

  useEffect(() => {
    const className = "dark";
    const bodyClass = window.document.body.classList;

    colorMode === "dark"
      ? bodyClass.add(className)
      : bodyClass.remove(className);
  }, [colorMode]);

  useEffect(() => {
    const follow = (event: Event) => setStoredColorMode((event as CustomEvent<string>).detail);
    window.addEventListener(CHANGED, follow);
    return () => window.removeEventListener(CHANGED, follow);
  }, [setStoredColorMode]);

  const setColorMode = useCallback((next: string) => {
    setStoredColorMode(next);
    window.dispatchEvent(new CustomEvent(CHANGED, { detail: next }));
  }, [setStoredColorMode]);

  return [colorMode, setColorMode] as const;
};

export default useColorMode;
