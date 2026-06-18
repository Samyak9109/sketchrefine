import { configureStore } from "@reduxjs/toolkit";
import boardReducer from "./slices/boardslice";

const store = configureStore({
    reducer:{
        board: boardReducer
    }
})


export default store;