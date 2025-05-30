import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Chip,
} from '@mui/material';
import {
  Add,
  Visibility,
  FilterList,
  Search,
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { format } from 'date-fns';
import { useDebouncedCallback } from 'use-debounce';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useTypedSelector } from '../hooks/useTypedSelector';
import {
  fetchTickets,
  createTicket,
  setFilters,
} from '../store/slices/ticketsSlice';
import { TicketStatus, TicketPriority, UserRole } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { FilterDialog } from '../components/tickets/FilterDialog';
import VisibilityIcon from '@mui/icons-material/Visibility';


interface CreateTicketForm {
  title: string;
  description: string;
  priority: TicketPriority;
}

const StatusChip = ({ status }: { status: string }) => {
  let color: 'default' | 'primary' | 'success' | 'warning' | 'error' = 'default';

  switch (status) {
    case 'OPEN':
      color = 'primary';
      break;
    case 'RESOLVED':
      color = 'success';
      break;
    case 'IN_PROGRESS':
      color = 'warning';
      break;
    case 'CLOSED':
      color = 'error';
      break;
    default:
      color = 'default';
  }

  return <Chip label={status} color={color} size="small" />;
};

const PriorityChip = ({ priority }: { priority: string }) => {
  let color: 'success' | 'warning' | 'error' | 'default' = 'default';

  switch (priority) {
    case 'LOW':
      color = 'success';
      break;
    case 'MEDIUM':
      color = 'warning';
      break;
    case 'HIGH':
    case 'URGENT':
      color = 'error';
      break;
    default:
      color = 'default';
  }

  return <Chip label={priority} color={color} size="small" />;
};


export const TicketsPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { tickets, loading, error, pagination, filters } = useTypedSelector(
    (state) => state.tickets
  );
  const { user } = useTypedSelector((state) => state.auth);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedCallback((value: string) => {
    dispatch(
      fetchTickets({
        page: pagination.page,
        limit: pagination.limit,
        filters: { ...filters, search: value },
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })
    );
  }, 500);

  const { control, handleSubmit, reset } = useForm<CreateTicketForm>();

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const loadTickets = async () => {
      try {
        await dispatch(
          fetchTickets({
            page: 1,
            limit: 10,
            sortBy: 'createdAt',
            sortOrder: 'desc',
          })
        ).unwrap();
      } catch (err) {
        console.error('Failed to load tickets:', err);
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
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
        <Button variant="contained" onClick={() => setRetryCount((prev) => prev + 1)}>
          Retry Loading Tickets
        </Button>
      </Box>
    );
  }

  const handleViewTicket = (ticketId: string) => {
    navigate(`/tickets/${ticketId}`);
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.OPEN:
        return 'primary';
      case TicketStatus.IN_PROGRESS:
        return 'warning';
      case TicketStatus.RESOLVED:
        return 'success';
      case TicketStatus.CLOSED:
        return 'default';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case TicketPriority.LOW:
        return 'success';
      case TicketPriority.MEDIUM:
        return 'warning';
      case TicketPriority.HIGH:
      case TicketPriority.URGENT:
        return 'error';
      default:
        return 'default';
    }
  };

  const canCreateTicket = user?.role === UserRole.CUSTOMER || user?.role === UserRole.ADMIN;

  const handleCreateTicket = (data: CreateTicketForm) => {
    dispatch(createTicket(data));
    setCreateDialogOpen(false);
    reset();
  };

  const handleApplyFilters = (newFilters: any) => {
    dispatch(setFilters(newFilters));
    dispatch(
      fetchTickets({
        page: 1,
        limit: pagination.limit,
        filters: newFilters,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })
    );
  };

  const columns: GridColDef[] = [
    { field: 'title', headerName: 'Title', flex: 1 },
  
    { field: 'status', headerName: 'Status', flex: 1, renderCell: (params) => <StatusChip status={params.value} /> },
  
    { field: 'priority', headerName: 'Priority', flex: 1, renderCell: (params) => <PriorityChip priority={params.value} /> },
  
    {
      field: 'customer',
      headerName: 'Customer',
      flex: 1,
      renderCell: (params) => {
        const row = params.row;
        console.log('Customer row data:', row); // Debug log
        
        if (!row) return <span>-</span>;
        
        // Handle the actual data structure
        if (row.customer) {
          const { firstName, lastName, name, email } = row.customer;
          const fullName = `${firstName || ''} ${lastName || ''}`.trim() || name || email || 'Unknown Customer';
          return <span>{fullName}</span>;
        }
        
        const fallbackName = row.customerName || row.createdBy?.name || 'Unknown Customer';
        return <span>{fallbackName}</span>;
      },
    },
  
    {
      field: 'createdAt',
      headerName: 'Created At',
      flex: 1,
      renderCell: (params) => {
        const row = params.row;
        console.log('Date row data:', row); // Debug log
        console.log('CreatedAt value:', row?.createdAt); // Debug log
        
        if (!row || !row.createdAt) {
          return <span>No Date</span>;
        }
        
        try {
          const date = new Date(row.createdAt);
          if (!isNaN(date.getTime())) {
            const formattedDate = format(date, 'MMM dd, yyyy HH:mm');
            console.log('Formatted date:', formattedDate); // Debug log
            return <span>{formattedDate}</span>;
          }
          return <span>Invalid Date</span>;
        } catch (error) {
          console.error('Date parsing error:', error);
          return <span>Date Error</span>;
        }
      }
    },
  
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      sortable: false,
      renderCell: (params) => (
        <IconButton onClick={() => handleViewTicket(params.row?.id)}>
          <VisibilityIcon />
        </IconButton>
      )
    }
  ];
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Tickets
      </Typography>

      <Box display="flex" justifyContent="space-between" mb={2}>
        <Box display="flex" gap={1}>
          {canCreateTicket && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Ticket
            </Button>
          )}
          <IconButton
            color="primary"
            onClick={() => setFilterDialogOpen(true)}
          >
            <FilterList />
          </IconButton>
        </Box>

        <Box display="flex" alignItems="center">
          <TextField
            variant="outlined"
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <Search />
              ),
            }}
          />
        </Box>
      </Box>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <Box sx={{ flexGrow: 1, height: '100%', minHeight: 400 }}>
          <DataGrid
            rows={tickets}
            columns={columns}
            pageSize={pagination.limit}
            rowsPerPageOptions={[10, 20, 50]}
            pagination
            paginationMode="server"
            rowCount={pagination.total}
            onPageChange={(page) =>
              dispatch(
                fetchTickets({
                  page: page + 1,
                  limit: pagination.limit,
                  filters,
                  sortBy: 'createdAt',
                  sortOrder: 'desc',
                })
              )
            }
            onPageSizeChange={(newPageSize) =>
              dispatch(
                fetchTickets({
                  page: 1,
                  limit: newPageSize,
                  filters,
                  sortBy: 'createdAt',
                  sortOrder: 'desc',
                })
              )
            }
          />
        </Box>
      )}

      {/* Create Ticket Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>Create Ticket</DialogTitle>
        <form onSubmit={handleSubmit(handleCreateTicket)}>
          <DialogContent>
            <Controller
              name="title"
              control={control}
              defaultValue=""
              rules={{ required: 'Title is required' }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Title"
                  fullWidth
                  margin="normal"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="description"
              control={control}
              defaultValue=""
              rules={{ required: 'Description is required' }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Description"
                  fullWidth
                  margin="normal"
                  multiline
                  rows={4}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="priority"
              control={control}
              defaultValue={TicketPriority.MEDIUM}
              render={({ field }) => (
                <FormControl fullWidth margin="normal">
                  <InputLabel>Priority</InputLabel>
                  <Select
                    {...field}
                    label="Priority"
                  >
                    {Object.values(TicketPriority).map((priority) => (
                      <MenuItem key={priority} value={priority}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)} color="primary">
              Cancel
            </Button>
            <Button type="submit" color="primary">
              Create Ticket
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      {/* Filter Dialog */}
      <FilterDialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        filters={filters}
        onApplyFilters={handleApplyFilters}
        onClearFilters={() => handleApplyFilters({})}
        onReset={() => {
          setSearchTerm('');
          handleApplyFilters({});
        }}
      />
    </Box>
  );
}

