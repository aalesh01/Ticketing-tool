import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { DashboardStats } from '../../types';
import { apiRequest } from '../../services/api';
import { API_ENDPOINTS } from '../../config/api';

interface DashboardState {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  stats: null,
  loading: false,
  error: null,
};

export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Fetching dashboard stats...');
      const response = await apiRequest.get<DashboardStats>(API_ENDPOINTS.DASHBOARD.STATS);
      console.log('Dashboard stats received:', response);
      return response;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return rejectWithValue('Failed to load dashboard data. Please try again.');
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
        state.error = null;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch dashboard stats';
        state.stats = null;
      });
  },
});

export const { clearError } = dashboardSlice.actions;
export default dashboardSlice.reducer;
