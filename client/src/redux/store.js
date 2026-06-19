import { configureStore } from "@reduxjs/toolkit";
import boardReducer from "./slices/boardslice";
import toolReducer from "./slices/toolSlice"

const store = configureStore({
    reducer:{
        board: boardReducer,
        tools: toolReducer
    }
})


export default store;