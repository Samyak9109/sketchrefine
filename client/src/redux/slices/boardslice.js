import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  strokes: [],
  redoStack: [],
};

export const boardSlice = createSlice({
  name: "board",
  initialState,
  reducers: {
    addStroke: (state, action) => {
      state.strokes.push(action.payload);
      state.redoStack = []; // new action invalidates redo history
    },
    clearBoard: (state) => {
      state.strokes = [];
      state.redoStack = [];
    },
    setBoard: (state, action) => {
      state.strokes = action.payload;
      state.redoStack = [];
    },
    undoStroke: (state) => {
      const last = state.strokes.pop();
      if (last) state.redoStack.push(last);
    },
    redoStroke: (state, action) => {
      const restored = action.payload ?? state.redoStack.pop();
      if (restored) state.strokes.push(restored);
    },
    updateStroke: (state, action) => {
      const updatedStroke = action.payload;
      const index = state.strokes.findIndex(
        (stroke) => stroke.id === updatedStroke.id,
      );

      if (index !== -1) {
        state.strokes[index] = updatedStroke;
        state.redoStack = [];
      }
    },
    deleteStroke: (state, action) => {
      state.strokes = state.strokes.filter(
        (stroke) => stroke.id !== action.payload,
      );
      state.redoStack = [];
    },
  },
});

export const {
  addStroke,
  clearBoard,
  setBoard,
  undoStroke,
  redoStroke,
  updateStroke,
  deleteStroke,
} = boardSlice.actions;
export default boardSlice.reducer;
