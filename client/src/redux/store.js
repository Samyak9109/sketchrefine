import { configureStore } from "@reduxjs/toolkit";
import boardReducer from "./slices/boardslice";
import toolReducer from "./slices/toolSlice";
import { saveAppearance } from "../utils/appearanceStorage.js";

const store = configureStore({
  reducer: {
    board: boardReducer,
    tools: toolReducer,
  },
});

let previousAppearance = {
  theme: store.getState().tools.theme,
  pageStyle: store.getState().tools.pageStyle,
};

store.subscribe(() => {
  const { theme, pageStyle } = store.getState().tools;
  const nextAppearance = { theme, pageStyle };

  if (
    previousAppearance.theme !== nextAppearance.theme ||
    previousAppearance.pageStyle !== nextAppearance.pageStyle
  ) {
    saveAppearance(nextAppearance);
    previousAppearance = nextAppearance;
  }
});

export default store;
