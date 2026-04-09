import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  username: string;
}

const initialState: UserState = {
  username: localStorage.getItem('@codeleap:username') || '',
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUsername: (state, action: PayloadAction<string>) => {
      state.username = action.payload;
      localStorage.setItem('@codeleap:username', action.payload);
    },
    logout: (state) => {
      state.username = '';
      localStorage.removeItem('@codeleap:username');
    }
  },
});

export const { setUsername, logout } = userSlice.actions;
export default userSlice.reducer;