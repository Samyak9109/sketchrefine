import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  strokes: [],
};

export const boardSlice = createSlice({
  name: "board",
  initialState,
  reducers: {
    addStroke: (state, action) => {
      state.strokes.push(action.payload);
    },
    clearBoard: (state) => {
      state.strokes = [];
    },
  },
});

export const { addStroke, clearBoard } = boardSlice.actions;
export default boardSlice.reducer;