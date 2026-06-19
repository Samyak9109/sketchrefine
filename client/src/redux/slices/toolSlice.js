import { createSlice } from "@reduxjs/toolkit";
import {
  DEFAULT_DRAWING_COLOR,
  DEFAULT_STROKE_WIDTH,
} from "../../constants/whiteboard.js";
import { loadAppearance } from "../../utils/appearanceStorage.js";

const savedAppearance = loadAppearance();

const initialState = {
  color: DEFAULT_DRAWING_COLOR,
  opacity: 1,
  width: DEFAULT_STROKE_WIDTH,
  tool: "pen",
  shape: "rectangle",
  theme: savedAppearance.theme,
  pageStyle: savedAppearance.pageStyle,
};

export const toolSlice = createSlice({
  name: "tools",
  initialState,
  reducers: {
    setColor: (state, action) => {
      state.color = action.payload;
    },
    setOpacity: (state, action) => {
      state.opacity = action.payload;
    },
    setWidth: (state, action) => {
      state.width = action.payload;
    },
    setTool: (state, action) => {
      state.tool = action.payload;
    },
    setShape: (state, action) => {
      state.shape = action.payload;
      state.tool = "shape";
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === "dark" ? "light" : "dark";
    },
    setPageStyle: (state, action) => {
      state.pageStyle = action.payload;
    },
  },
});

export const {
  setColor,
  setOpacity,
  setWidth,
  setTool,
  setShape,
  setTheme,
  toggleTheme,
  setPageStyle,
} = toolSlice.actions;
export default toolSlice.reducer;
