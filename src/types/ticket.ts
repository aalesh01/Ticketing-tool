export interface Ticket {
  id?: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt?: Date;
  updatedAt?: Date;
}
