import { createSlice } from '@reduxjs/toolkit';

const friendSlice = createSlice({
  name: 'friends',
  initialState: {
    allUsers: [],
    friendRequests: [],  // requests you received
    sentRequests: [],    // requests you sent
    friends: []          // accepted friends
  },
  reducers: {
    setAllUsers: (state, action) => {
      state.allUsers = action.payload;
    },
    setFriendRequests: (state, action) => {
      state.friendRequests = action.payload;
    },
    setSentRequests: (state, action) => {
      state.sentRequests = action.payload;
    },
    setFriends: (state, action) => {
      state.friends = action.payload;
    }
  }
});

export const {
  setAllUsers,
  setFriendRequests,
  setSentRequests,
  setFriends
} = friendSlice.actions;

export default friendSlice.reducer;