import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Ticket, Message, TicketFilters, PaginatedResponse, TicketStatus, TicketPriority } from '../../types';
import { apiRequest } from '../../services/api';
import { API_ENDPOINTS } from '../../config/api';
import wsService from '../../services/WebSocketService';

interface TicketsState {
  tickets: Ticket[];
  currentTicket: Ticket | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: TicketFilters;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const initialState: TicketsState = {
  tickets: [], // Initialize as empty array
  currentTicket: null,
  messages: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {},
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export const fetchTickets = createAsyncThunk(
  'tickets/fetchTickets',
  async (params: { page?: number; limit?: number; filters?: TicketFilters; sortBy?: string; sortOrder?: 'asc' | 'desc' }) => {
    try {
      const queryParams = new URLSearchParams({
        page: String(params.page || 1),
        limit: String(params.limit || 10),
        sortBy: params.sortBy || 'createdAt',
        sortOrder: params.sortOrder || 'desc',
      });

      // Properly handle filters
      if (params.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              value.forEach(item => queryParams.append(key, String(item)));
            } else {
              queryParams.append(key, String(value));
            }
          }
        });
      }
      
      const response = await apiRequest.get<PaginatedResponse<Ticket>>(
        `${API_ENDPOINTS.TICKETS.LIST}?${queryParams}`
      );

      console.log('Tickets response:', response);

      if (!response || !response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response format');
      }

      return {
        data: response.data,
        page: response.page || 1,
        limit: response.limit || 10,
        total: response.total || 0,
        totalPages: response.totalPages || 0
      };
    } catch (error) {
      console.error('Error fetching tickets:', error);
      throw error;
    }
  }
);

export const fetchTicketById = createAsyncThunk(
  'tickets/fetchTicketById',
  async (ticketId: string) => {
    const response = await apiRequest.get<Ticket>(API_ENDPOINTS.TICKETS.GET(ticketId));
    return response.data;
  }
);

export const fetchTicketMessages = createAsyncThunk(
  'tickets/fetchTicketMessages',
  async (ticketId: string) => {
    const response = await apiRequest.get<Message[]>(API_ENDPOINTS.TICKETS.MESSAGES(ticketId));
    return response.data;
  }
);

export const createTicket = createAsyncThunk(
  'tickets/createTicket',
  async (ticketData: Partial<Ticket>) => {
    const response = await apiRequest.post<Ticket>(API_ENDPOINTS.TICKETS.CREATE, ticketData);
    return response.data;
  }
);

export const updateTicket = createAsyncThunk(
  'tickets/updateTicket',
  async ({ ticketId, updates }: { ticketId: string; updates: Partial<Ticket> }) => {
    const response = await apiRequest.put<Ticket>(API_ENDPOINTS.TICKETS.UPDATE(ticketId), updates);
    return response.data;
  }
);

export const addMessage = createAsyncThunk(
  'tickets/addMessage',
  async ({ ticketId, content, isInternal }: { ticketId: string; content: string; isInternal: boolean }) => {
    const response = await apiRequest.post<Message>(
      API_ENDPOINTS.TICKETS.ADD_MESSAGE(ticketId),
      { content, isInternal }
    );
    return response.data;
  }
);

const ticketsSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<TicketFilters>) => {
      state.filters = action.payload;
    },
    setSorting: (state, action: PayloadAction<{ sortBy: string; sortOrder: 'asc' | 'desc' }>) => {
      state.sortBy = action.payload.sortBy;
      state.sortOrder = action.payload.sortOrder;
    },
    clearCurrentTicket: (state) => {
      state.currentTicket = null;
      state.messages = [];
    },
    updateTicketRealtime: (state, action: PayloadAction<Ticket>) => {
      const index = state.tickets.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.tickets[index] = action.payload;
      }
      if (state.currentTicket?.id === action.payload.id) {
        state.currentTicket = action.payload;
      }
    },
    addMessageRealtime: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
        // Don't clear tickets array to avoid UI flicker
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.tickets = action.payload.data;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch tickets';
        state.tickets = []; // Clear on error
      })
      .addCase(fetchTicketById.fulfilled, (state, action) => {
        state.currentTicket = action.payload;
      })
      .addCase(fetchTicketMessages.fulfilled, (state, action) => {
        state.messages = action.payload;
      })
      .addCase(createTicket.fulfilled, (state, action) => {
        state.tickets.unshift(action.payload);
      })
      .addCase(updateTicket.fulfilled, (state, action) => {
        const index = state.tickets.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.tickets[index] = action.payload;
        }
        if (state.currentTicket?.id === action.payload.id) {
          state.currentTicket = action.payload;
        }
      })
      .addCase(addMessage.fulfilled, (state, action) => {
        state.messages.push(action.payload);
      });
  },
});

export const { 
  setFilters, 
  setSorting, 
  clearCurrentTicket, 
  updateTicketRealtime, 
  addMessageRealtime, 
  clearError 
} = ticketsSlice.actions;
export default ticketsSlice.reducer;
