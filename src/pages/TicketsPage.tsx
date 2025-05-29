import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
} from '@mui/material';
import {
  Add,
  Visibility,
  FilterList,
  Search,
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { format } from 'date-fns';
import { useDebouncedCallback } from 'use-debounce';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useTypedSelector } from '../hooks/useTypedSelector';
import { fetchTickets, createTicket, setFilters } from '../store/slices/ticketsSlice';
import { TicketStatus, TicketPriority, UserRole } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

interface CreateTicketForm {
  title: string;
  description: string;
  priority: TicketPriority;
}

export const TicketsPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { tickets, loading, error, pagination, filters } = useTypedSelector(state => state.tickets);
  const { user } = useTypedSelector(state => state.auth);
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedCallback(
    (value: string) => {
      dispatch(fetchTickets({ 
        page: pagination.page, 
        limit: pagination.limit,
        filters: { ...filters, search: value },
        sortBy: 'createdAt',
        sortOrder: 'desc'
      }));
    },
    500
  );

  const { control, handleSubmit, reset } = useForm<CreateTicketForm>();

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  // Add error handling and retry logic
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const loadTickets = async () => {
      try {
        await dispatch(fetchTickets({
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        })).unwrap();
      } catch (err) {
        console.error('Failed to load tickets:', err);
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, Math.pow(2, retryCount) * 1000);
        }
      }
    };

    loadTickets();
  }, [dispatch, retryCount]);

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
          Retry Loading Tickets
        </Button>
      </Box>
    );
  }

  const handlePageChange = (event: unknown, newPage: number) => {
    dispatch(fetchTickets({ 
      page: newPage + 1, 
      limit: pagination.limit,
      filters
    }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newLimit = parseInt(event.target.value, 10);
    dispatch(fetchTickets({ 
      page: 1, 
      limit: newLimit,
      filters
    }));
  };

  const handleCreateTicket = (data: CreateTicketForm) => {
    dispatch(createTicket(data));
    setCreateDialogOpen(false);
    reset();
  };

  const handleViewTicket = (ticketId: string) => {
    navigate(`/tickets/${ticketId}`);
  };

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

  const canCreateTicket = user?.role === UserRole.CUSTOMER || user?.role === UserRole.ADMIN;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Tickets</Typography>
        <Box display="flex" gap={2}>
          <TextField
            placeholder="Search tickets..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          <IconButton onClick={() => setFilterDialogOpen(true)}>
            <FilterList />
          </IconButton>
          {canCreateTicket && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Ticket
            </Button>
          )}
        </Box>
      </Box>

      {loading ? (
        <LoadingSpinner message="Loading tickets..." />
      ) : (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Assignee</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(tickets) && tickets.length > 0 ? (
                  tickets.map((ticket) => ticket && (
                    <TableRow key={ticket?.id || 'unknown'}>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {ticket?.title || 'Untitled'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={ticket?.status || 'UNKNOWN'}
                          color={getStatusColor(ticket?.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={ticket?.priority || 'UNKNOWN'}
                          color={getPriorityColor(ticket?.priority)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {ticket?.customer ? 
                          `${ticket.customer.firstName} ${ticket.customer.lastName}` : 
                          'Unknown Customer'
                        }
                      </TableCell>
                      <TableCell>
                        {ticket?.assignee ? 
                          `${ticket.assignee.firstName} ${ticket.assignee.lastName}` :
                          'Unassigned'
                        }
                      </TableCell>
                      <TableCell>
                        {ticket?.createdAt ? 
                          format(new Date(ticket.createdAt), 'MMM dd, yyyy') :
                          'Unknown Date'
                        }
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => ticket?.id && handleViewTicket(ticket.id)}
                          disabled={!ticket?.id}
                        >
                          <Visibility />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="textSecondary">
                        {loading ? 'Loading tickets...' : 'No tickets found'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {tickets && tickets.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={pagination?.total || 0}
              rowsPerPage={pagination?.limit || 10}
              page={(pagination?.page || 1) - 1}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
            />
          )}
        </Paper>
      )}

      {/* Create Ticket Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Ticket</DialogTitle>
        <form onSubmit={handleSubmit(handleCreateTicket)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="title"
                  control={control}
                  defaultValue=""
                  rules={{ required: 'Title is required' }}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      label="Title"
                      fullWidth
                      error={!!error}
                      helperText={error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="description"
                  control={control}
                  defaultValue=""
                  rules={{ required: 'Description is required' }}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      label="Description"
                      multiline
                      rows={4}
                      fullWidth
                      error={!!error}
                      helperText={error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="priority"
                  control={control}
                  defaultValue={TicketPriority.MEDIUM}
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
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Create</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
