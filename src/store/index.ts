
import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import ticketsSlice from './slices/ticketsSlice';
import uiSlice from './slices/uiSlice';
import usersSlice from './slices/usersSlice';
import dashboardSlice from './slices/dashboardSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    tickets: ticketsSlice,
    ui: uiSlice,
    users: usersSlice,
    dashboard: dashboardSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
