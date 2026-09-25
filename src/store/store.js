import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import friendReducer from "./slices/friendSlice";
import notificationReducer from "./slices/notificationSlice";
import postReducer from "./slices/postSlice";
import profileReducer from "./slices/profileSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    posts: postReducer,
    profile: profileReducer,
    notifications: notificationReducer,
    friends: friendReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export default store;
