
import { User, UserRole } from '../types';

// Mock user database
const mockUsers = [
  {
    id: '1',
    email: 'customer@demo.com',
    password: 'password123',
    firstName: 'Demo',
    lastName: 'Customer',
    role: UserRole.CUSTOMER,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2', 
    email: 'agent@demo.com',
    password: 'password123',
    firstName: 'Demo',
    lastName: 'Agent',
    role: UserRole.AGENT,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    email: 'admin@demo.com', 
    password: 'password123',
    firstName: 'Demo',
    lastName: 'Admin',
    role: UserRole.ADMIN,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockAuthService = {
  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const user = mockUsers.find(u => u.email === email && u.password === password);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    const { password: _, ...userWithoutPassword } = user;
    const token = `mock_token_${user.id}_${Date.now()}`;
    
    return {
      user: userWithoutPassword as User,
      token,
    };
  },
  
  getCurrentUser: async (token: string): Promise<User> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Extract user ID from mock token
    const userId = token.split('_')[2];
    const user = mockUsers.find(u => u.id === userId);
    
    if (!user) {
      throw new Error('Invalid token');
    }
    
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  },
  
  logout: async (): Promise<void> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    // No actual logout logic needed for mock
  },
};
