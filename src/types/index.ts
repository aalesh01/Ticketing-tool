export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  AGENT = 'AGENT',
  ADMIN = 'ADMIN'
}

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED'
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  customerId: string;
  customer: User;
  assigneeId?: string;
  assignee?: User;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  messageCount: number;
}

export interface Message {
  id: string;
  ticketId: string;
  userId: string;
  user: User;
  content: string;
  isInternal: boolean;
  attachments?: Attachment[];
  createdAt: string;
}

export interface Attachment {
  id: string;
  messageId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TicketFilters {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  assigneeId?: string;
  customerId?: string;
  tags?: string[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  ticketsByPriority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  averageResolutionTime: number;
  averageResponseTime: number;
  customerSatisfaction: number;
  agentPerformance: Array<{
    agentId: string;
    agentName: string;
    ticketsResolved: number;
    averageResolutionTime: number;
  }>;
  recentActivity: Ticket[];
}
