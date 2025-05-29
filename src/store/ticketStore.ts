interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

class TicketStore {
  private tickets: Ticket[] = [];

  createTicket(data: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>): Ticket {
    const ticket = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.tickets.push(ticket);
    return ticket;
  }

  getAllTickets(): Ticket[] {
    return this.tickets;
  }
}

export const ticketStore = new TicketStore();
