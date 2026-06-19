import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  color: "black",
  width: 3,
};

export const toolSlice = createSlice({
  name: "tools",
  initialState,
  reducers: {
    setColor: (state, action) => {
      state.color = action.payload;
    },
    setWidth: (state, action) => {
      state.width = action.payload;
    },
  },
});

export const { setColor, setWidth } = toolSlice.actions;
export default toolSlice.reducer;
