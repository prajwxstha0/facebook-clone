import { createSlice } from '@reduxjs/toolkit';

const postSlice = createSlice({
  name: 'posts',
  initialState: {
    posts: [],
    loading: false,
    error: null
  },
  reducers: {
    //  Set all posts
    setPosts: (state, action) => {
      state.posts = action.payload;
    },

    //  Add new post
    addPost: (state, action) => {
      state.posts.unshift(action.payload); // add to top
    },

    //  Update a post (likes, comments)
    updatePost: (state, action) => {
      const index = state.posts.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.posts[index] = action.payload;
      }
    },

    //  Delete a post
    deletePost: (state, action) => {
      state.posts = state.posts.filter(p => p.id !== action.payload);
    },

    //  Set loading
    setPostsLoading: (state, action) => {
      state.loading = action.payload;
    },

    //  Set error
    setPostsError: (state, action) => {
      state.error = action.payload;
    }
  }
});

export const {
    setPosts,
    addPosts,
    updatePost,
    deletePost,
    setPostsError,
    setPostsLoading
} = postSlice.actions;

export default postSlice.reducer;