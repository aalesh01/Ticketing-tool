
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  Divider,
  Avatar,
  Typography,
} from '@mui/material';
import {
  Dashboard,
  ConfirmationNumber,
  People,
  Settings,
  AdminPanelSettings,
  Support,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTypedSelector } from '../../hooks/useTypedSelector';
import { UserRole } from '../../types';

const DRAWER_WIDTH = 240;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export const Sidebar = ({ open, onClose }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useTypedSelector(state => state.auth);

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <Dashboard />,
      path: '/dashboard',
      roles: [UserRole.ADMIN, UserRole.AGENT],
    },
    {
      text: 'Tickets',
      icon: <ConfirmationNumber />,
      path: '/tickets',
      roles: [UserRole.CUSTOMER, UserRole.AGENT, UserRole.ADMIN],
    },
    {
      text: 'Users',
      icon: <People />,
      path: '/users',
      roles: [UserRole.ADMIN],
    },
    {
      text: 'Support',
      icon: <Support />,
      path: '/support',
      roles: [UserRole.CUSTOMER],
    },
    {
      text: 'Admin Panel',
      icon: <AdminPanelSettings />,
      path: '/admin',
      roles: [UserRole.ADMIN],
    },
    {
      text: 'Settings',
      icon: <Settings />,
      path: '/settings',
      roles: [UserRole.CUSTOMER, UserRole.AGENT, UserRole.ADMIN],
    },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <Drawer
      variant="temporary"
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
        },
      }}
    >
      <Toolbar />
      
      {/* User Profile Section */}
      {user && (
        <Box sx={{ p: 2 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" noWrap>
                {user.firstName} {user.lastName}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {user.role}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
      
      <Divider />
      
      <List>
        {filteredMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};
