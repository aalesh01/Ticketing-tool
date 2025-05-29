
import { Box, Toolbar } from '@mui/material';
import { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useTypedSelector } from '../../hooks/useTypedSelector';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { setSidebarOpen } from '../../store/slices/uiSlice';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const dispatch = useAppDispatch();
  const { sidebarOpen } = useTypedSelector(state => state.ui);

  const handleSidebarClose = () => {
    dispatch(setSidebarOpen(false));
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Header />
      <Sidebar open={sidebarOpen} onClose={handleSidebarClose} />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};
