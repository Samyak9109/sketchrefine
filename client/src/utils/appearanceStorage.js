import {
  APPEARANCE_STORAGE_KEY,
  DEFAULT_APPEARANCE,
} from "../constants/whiteboard.js";

export const loadAppearance = () => {
  try {
    if (typeof window === "undefined") return DEFAULT_APPEARANCE;

    const savedAppearance = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
    if (!savedAppearance) return DEFAULT_APPEARANCE;

    const parsedAppearance = JSON.parse(savedAppearance);
    const theme =
      parsedAppearance.theme === "dark" || parsedAppearance.theme === "light"
        ? parsedAppearance.theme
        : DEFAULT_APPEARANCE.theme;
    const pageStyle =
      parsedAppearance.pageStyle === "grid" ||
      parsedAppearance.pageStyle === "blank"
        ? parsedAppearance.pageStyle
        : DEFAULT_APPEARANCE.pageStyle;

    return { theme, pageStyle };
  } catch {
    return DEFAULT_APPEARANCE;
  }
};

export const saveAppearance = ({ theme, pageStyle }) => {
  try {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(
      APPEARANCE_STORAGE_KEY,
      JSON.stringify({ theme, pageStyle }),
    );
  } catch {
    // Persistence should never block drawing controls.
  }
};
