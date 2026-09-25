import { createSlice } from '@reduxjs/toolkit';

const profileSlice = createSlice({
  name: 'profile',
  initialState: {
    viewedProfile: null,  // profile you're viewing
    userPosts: [],        // posts of viewed profile
    loading: false,
    error: null
  },
  reducers: {
    //  Set viewed profile
    setViewedProfile: (state, action) => {
      state.viewedProfile = action.payload;
    },

    //  Update viewed profile fields
    updateViewedProfile: (state, action) => {
      state.viewedProfile = { ...state.viewedProfile, ...action.payload };
    },

    //  Set user's posts
    setUserPosts: (state, action) => {
      state.userPosts = action.payload;
    },

    //  Set loading
    setProfileLoading: (state, action) => {
      state.loading = action.payload;
    },

    //  Set error
    setProfileError: (state, action) => {
      state.error = action.payload;
    },

    //  Clear profile when leaving page
    clearProfile: (state) => {
      state.viewedProfile = null;
      state.userPosts = [];
    }
  }
});

export const { setViewedProfile,
    updateViewedProfile,
    setUserPosts,
    setProfileLoading,
    setProfileError,
    clearProfile
} = profileSlice.actions;
export default profileSlice.reducer;
