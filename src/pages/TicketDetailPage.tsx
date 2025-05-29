
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Person,
  AccessTime,
  PriorityHigh,
} from '@mui/icons-material';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useTypedSelector } from '../hooks/useTypedSelector';
import { fetchTicketById, updateTicket, addMessage } from '../store/slices/ticketsSlice';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { TicketStatus, TicketPriority, UserRole } from '../types';

const updateTicketSchema = z.object({
  status: z.nativeEnum(TicketStatus),
  priority: z.nativeEnum(TicketPriority),
});

const messageSchema = z.object({
  content: z.string().min(1, 'Message content is required'),
  isInternal: z.boolean().optional(),
});

type UpdateTicketForm = z.infer<typeof updateTicketSchema>;
type MessageForm = z.infer<typeof messageSchema>;

export const TicketDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { currentTicket, loading } = useTypedSelector(state => state.tickets);
  const { user } = useTypedSelector(state => state.auth);

  const {
    control: updateControl,
    handleSubmit: handleUpdateSubmit,
    reset: resetUpdate,
  } = useForm<UpdateTicketForm>({
    resolver: zodResolver(updateTicketSchema),
  });

  const {
    control: messageControl,
    handleSubmit: handleMessageSubmit,
    reset: resetMessage,
  } = useForm<MessageForm>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      isInternal: false,
    },
  });

  useEffect(() => {
    if (id) {
      dispatch(fetchTicketById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (currentTicket) {
      resetUpdate({
        status: currentTicket.status,
        priority: currentTicket.priority,
      });
    }
  }, [currentTicket, resetUpdate]);

  const handleUpdateTicket = (data: UpdateTicketForm) => {
    if (currentTicket) {
      dispatch(updateTicket({
        ticketId: currentTicket.id,
        updates: data,
      }));
    }
  };

  const handleSendMessage = (data: MessageForm) => {
    if (currentTicket) {
      dispatch(addMessage({
        ticketId: currentTicket.id,
        content: data.content,
        isInternal: data.isInternal || false,
      }));
      resetMessage();
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading ticket..." />;
  }

  if (!currentTicket) {
    return (
      <Box>
        <Typography variant="h6">Ticket not found</Typography>
      </Box>
    );
  }

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

  const canUpdateTicket = user?.role === UserRole.ADMIN || user?.role === UserRole.AGENT;
  const canSendInternalMessage = user?.role === UserRole.ADMIN || user?.role === UserRole.AGENT;

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4">
          Ticket #{currentTicket.id}
        </Typography>
        <Box display="flex" gap={1}>
          <Chip
            label={currentTicket.status}
            color={getStatusColor(currentTicket.status)}
          />
          <Chip
            label={currentTicket.priority}
            color={getPriorityColor(currentTicket.priority)}
            variant="outlined"
          />
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Ticket Info */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Ticket Information
            </Typography>
            
            <Box mb={3}>
              <Typography variant="subtitle2" gutterBottom>
                Title
              </Typography>
              <Typography variant="body1" gutterBottom>
                {currentTicket.title}
              </Typography>
            </Box>

            <Box mb={3}>
              <Typography variant="subtitle2" gutterBottom>
                Description
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {currentTicket.description}
              </Typography>
            </Box>

            <Box mb={3}>
              <Typography variant="subtitle2" gutterBottom>
                Customer
              </Typography>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ mr: 1 }}>
                  <Person />
                </Avatar>
                <Box>
                  <Typography variant="body2">
                    {currentTicket.customer.firstName} {currentTicket.customer.lastName}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {currentTicket.customer.email}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box mb={3}>
              <Typography variant="subtitle2" gutterBottom>
                Created
              </Typography>
              <Box display="flex" alignItems="center">
                <AccessTime sx={{ mr: 1, fontSize: 16 }} />
                <Typography variant="body2">
                  {new Date(currentTicket.createdAt).toLocaleString()}
                </Typography>
              </Box>
            </Box>

            {canUpdateTicket && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Update Ticket
                </Typography>
                <form onSubmit={handleUpdateSubmit(handleUpdateTicket)}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <Controller
                        name="status"
                        control={updateControl}
                        render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select {...field} label="Status">
                              {Object.values(TicketStatus).map((status) => (
                                <MenuItem key={status} value={status}>
                                  {status}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Controller
                        name="priority"
                        control={updateControl}
                        render={({ field }) => (
                          <FormControl fullWidth>
                            <InputLabel>Priority</InputLabel>
                            <Select {...field} label="Priority">
                              {Object.values(TicketPriority).map((priority) => (
                                <MenuItem key={priority} value={priority}>
                                  {priority}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Button type="submit" variant="contained" fullWidth>
                        Update Ticket
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Messages */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Messages
            </Typography>
            
            <List sx={{ maxHeight: 400, overflow: 'auto', mb: 3 }}>
              {/* Messages will be displayed here when the backend data includes them */}
              <ListItem>
                <ListItemAvatar>
                  <Avatar>
                    <Person />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary="No messages yet"
                  secondary="Start a conversation by sending a message below"
                />
              </ListItem>
            </List>

            {/* New Message Form */}
            <form onSubmit={handleMessageSubmit(handleSendMessage)}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Controller
                    name="content"
                    control={messageControl}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        label="Message"
                        multiline
                        rows={4}
                        fullWidth
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                </Grid>
                {canSendInternalMessage && (
                  <Grid size={{ xs: 12 }}>
                    <Controller
                      name="isInternal"
                      control={messageControl}
                      render={({ field }) => (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                            />
                          }
                          label="Internal message (not visible to customer)"
                        />
                      )}
                    />
                  </Grid>
                )}
                <Grid size={{ xs: 12 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                  >
                    Send Message
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
