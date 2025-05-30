import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Button
} from '@mui/material';
import {
  ConfirmationNumber,
  TrendingUp,
  AccessTime,
  CheckCircle,
  Person,
} from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useTypedSelector } from '../hooks/useTypedSelector';
import { fetchDashboardStats } from '../store/slices/dashboardSlice';
import { fetchTickets } from '../store/slices/ticketsSlice';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { TicketStatus, TicketPriority } from '../types';

export const DashboardPage = () => {
  const dispatch = useAppDispatch();
  const { stats, loading: statsLoading, error } = useTypedSelector(state => state.dashboard);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await dispatch(fetchDashboardStats()).unwrap();
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        // Retry up to 3 times with exponential backoff
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, Math.pow(2, retryCount) * 1000);
        }
      }
    };

    fetchData();
  }, [dispatch, retryCount]);

  if (statsLoading) {
    return <LoadingSpinner message="Loading dashboard data..." />;
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" gutterBottom>
          {error}
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => setRetryCount(prev => prev + 1)}
        >
          Retry
        </Button>
      </Box>
    );
  }

  if (!stats) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>No dashboard data available</Typography>
      </Box>
    );
  }

  const {
    totalTickets,
    openTickets,
    resolvedTickets,
    averageResolutionTime,
    agentPerformance = [],
    recentActivity = []
  } = stats;

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.OPEN: return 'primary';
      case TicketStatus.IN_PROGRESS: return 'warning';
      case TicketStatus.RESOLVED: return 'success';
      case TicketStatus.CLOSED: return 'default';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case TicketPriority.LOW: return 'success';
      case TicketPriority.MEDIUM: return 'warning';
      case TicketPriority.HIGH: return 'error';
      case TicketPriority.URGENT: return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <ConfirmationNumber color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{totalTickets || 0}</Typography>
                  <Typography color="textSecondary">Total Tickets</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUp color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{openTickets || 0}</Typography>
                  <Typography color="textSecondary">Open Tickets</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CheckCircle color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{resolvedTickets || 0}</Typography>
                  <Typography color="textSecondary">Resolved</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AccessTime color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{averageResolutionTime || 0}h</Typography>
                  <Typography color="textSecondary">Avg Resolution</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Tickets */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Tickets
            </Typography>
            <List>
              {recentActivity.length > 0 ? (
                recentActivity.map((ticket) => (
                  <ListItem key={ticket.id} divider>
                    <ListItemIcon>
                      <ConfirmationNumber />
                    </ListItemIcon>
                    <ListItemText
                      primary={ticket.title}
                      secondary={`${ticket.customer?.firstName} ${ticket.customer?.lastName}`}
                    />
                    <Box display="flex" gap={1}>
                      <Chip
                        label={ticket.status}
                        color={getStatusColor(ticket.status)}
                        size="small"
                      />
                      <Chip
                        label={ticket.priority}
                        color={getPriorityColor(ticket.priority)}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="No recent tickets" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Agent Performance */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Top Agents
            </Typography>
            <List>
              {agentPerformance.length > 0 ? (
                agentPerformance.map((agent) => (
                  <ListItem key={agent.agentId}>
                    <ListItemIcon>
                      <Person />
                    </ListItemIcon>
                    <ListItemText
                      primary={agent.agentName}
                      secondary={`${agent.ticketsResolved} tickets resolved`}
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="No agent data available" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
