import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const user = JSON.parse(localStorage.getItem('user'));
const API_URL = 'http://localhost:5000/api/auth/';

export const register = createAsyncThunk('auth/register', async (user, thunkAPI) => {
    try {
        const response = await axios.post(API_URL + 'register', user);
        if (response.data) localStorage.setItem('user', JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response.data.message || error.message);
    }
});

export const login = createAsyncThunk('auth/login', async (user, thunkAPI) => {
    try {
        const response = await axios.post(API_URL + 'login', user);
        if (response.data) localStorage.setItem('user', JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response.data.message || error.message);
    }
});

export const logout = createAsyncThunk('auth/logout', async () => {
    localStorage.removeItem('user');
});

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: user ? user : null,
        isError: false,
        isSuccess: false,
        isLoading: false,
        message: ''
    },
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(register.pending, (state) => { state.isLoading = true; })
            .addCase(register.fulfilled, (state, action) => {
                state.isLoading = false; state.isSuccess = true; state.user = action.payload;
            })
            .addCase(register.rejected, (state, action) => {
                state.isLoading = false; state.isError = true; state.message = action.payload; state.user = null;
            })
            .addCase(login.pending, (state) => { state.isLoading = true; })
            .addCase(login.fulfilled, (state, action) => {
                state.isLoading = false; state.isSuccess = true; state.user = action.payload;
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoading = false; state.isError = true; state.message = action.payload; state.user = null;
            })
            .addCase(logout.fulfilled, (state) => { state.user = null; });
    }
});

export const { reset } = authSlice.actions;
export default authSlice.reducer;
