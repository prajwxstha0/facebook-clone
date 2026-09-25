import { createSlice } from '@reduxjs/toolkit';

//  Load from sessionStorage on startup
function getSessionUser() {
  const data = sessionStorage.getItem('userProfile');
  return data ? JSON.parse(data) : null;
}

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    currentUser: null,
    userProfile: getSessionUser(), //  load from session
    loading: true,
    error: null
  },
  reducers: {
    //  Set current firebase user
    setCurrentUser: (state, action) => {
      state.currentUser = action.payload;
    },

    //  Set full user profile
    setUserProfile: (state, action) => {
      state.userProfile = action.payload;
      // Save to sessionStorage
      if (action.payload) {
        sessionStorage.setItem('userProfile', JSON.stringify(action.payload));
      } else {
        sessionStorage.removeItem('userProfile');
      }
    },

    //  Update specific profile fields
    updateProfile: (state, action) => {
      state.userProfile = { ...state.userProfile, ...action.payload };
      sessionStorage.setItem('userProfile', JSON.stringify(state.userProfile));
    },

    //  Clear user on logout
    clearUser: (state) => {
      state.currentUser = null;
      state.userProfile = null;
      sessionStorage.removeItem('userProfile');
    },

    //  Set loading state
    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    //  Set error
    setError: (state, action) => {
      state.error = action.payload;
    }
  }
});

export const {
  setCurrentUser,
  setUserProfile,
  updateProfile,
  clearUser,
  setLoading,
  setError
} = authSlice.actions;

export default authSlice.reducer;