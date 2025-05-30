import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  OutlinedInput,
  SelectChangeEvent, // Add this import
} from '@mui/material';
import { TicketStatus, TicketPriority, TicketFilters } from '../../types';
import { useState, useEffect } from 'react';

interface FilterDialogProps {
  open: boolean;
  onClose: () => void;
  filters: TicketFilters;
  onApplyFilters: (filters: TicketFilters) => void;
}

export const FilterDialog = ({ open, onClose, filters, onApplyFilters }: FilterDialogProps) => {
  console.log('FilterDialog render:', { open, filters }); // Add debug log

  // Initialize local filters with empty arrays if filters is undefined
  const [localFilters, setLocalFilters] = useState<TicketFilters>({
    status: [],
    priority: []
  });

  // Reset local filters when dialog opens
  useEffect(() => {
    console.log('Dialog open state:', open);
    if (open) {
      console.log('Initializing filters:', filters);
      setLocalFilters({
        status: filters?.status || [],
        priority: filters?.priority || []
      });
    }
  }, [open, filters]);

  const handleStatusChange = (event: SelectChangeEvent<unknown>) => {
    const value = event.target.value as TicketStatus[];
    console.log('Selected status:', value);
    setLocalFilters(prev => ({
      ...prev,
      status: value
    }));
  };

  const handlePriorityChange = (event: SelectChangeEvent<unknown>) => {
    const value = event.target.value as TicketPriority[];
    console.log('Selected priority:', value);
    setLocalFilters(prev => ({
      ...prev,
      priority: value
    }));
  };

  const handleApply = () => {
    console.log('Applying filters:', localFilters);
    onApplyFilters(localFilters);
    onClose();
  };

  const handleClear = () => {
    console.log('Clearing filters');
    const emptyFilters: TicketFilters = {
      status: [],
      priority: []
    };
    setLocalFilters(emptyFilters);
    onApplyFilters(emptyFilters);
    onClose();
  };

  const handleClose = () => {
    console.log('Dialog closing');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      keepMounted={false}
    >
      <DialogTitle>Filter Tickets</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} pt={1}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              multiple
              value={localFilters.status || []}
              onChange={handleStatusChange}
              input={<OutlinedInput label="Status" />}
              renderValue={(selected) => (
                <Box display="flex" flexWrap="wrap" gap={0.5}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
            >
              {Object.values(TicketStatus).map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select
              multiple
              value={localFilters.priority || []}
              onChange={handlePriorityChange}
              input={<OutlinedInput label="Priority" />}
              renderValue={(selected) => (
                <Box display="flex" flexWrap="wrap" gap={0.5}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
            >
              {Object.values(TicketPriority).map((priority) => (
                <MenuItem key={priority} value={priority}>
                  {priority}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClear}>Clear All</Button>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleApply} variant="contained">
          Apply Filters
        </Button>
      </DialogActions>
    </Dialog>
  );
};
