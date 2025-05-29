import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';

// Helper functions for mock data
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const randomChoice = (array) => array[Math.floor(Math.random() * array.length)];

// Create mock data generator function
const createMockTicket = (index) => {
  const createdAt = randomDate(new Date(2023, 0, 1), new Date());
  return {
    id: (index + 1).toString(),
    title: `Test Ticket ${index + 1}`,
    description: `Description for ticket ${index + 1}`,
    priority: randomChoice(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    status: randomChoice(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
    createdAt,
    updatedAt: randomDate(createdAt, new Date()),
    customer: { 
      id: `user${Math.floor(Math.random() * 5) + 1}`,
      firstName: randomChoice(['John', 'Jane', 'Bob', 'Alice', 'Charlie']), 
      lastName: randomChoice(['Doe', 'Smith', 'Johnson', 'Williams', 'Brown']),
      email: 'customer@example.com'
    },
    assignee: Math.random() > 0.3 ? {
      id: `agent${Math.floor(Math.random() * 3) + 1}`,
      firstName: randomChoice(['Support', 'Help', 'Service']),
      lastName: randomChoice(['Agent', 'Team', 'Desk']),
      email: 'agent@example.com'
    } : null
  };
};

// Initialize mock tickets
let mockTickets = Array.from({ length: 20 }, (_, i) => createMockTicket(i));

const app = express();

// Add OPTIONS handlers for all API endpoints
app.options('*', (req, res) => {
  console.log('Handling OPTIONS request for:', req.path);
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Max-Age', '86400');
  res.status(204).end();
  console.log('Sent OPTIONS response');
});

// Update CORS middleware to be more permissive
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(express.json()); // Add JSON parser middleware

// Add debug logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`, {
    headers: req.headers,
    query: req.query,
    body: req.method !== 'OPTIONS' ? req.body : undefined
  });
  next();
});

// Add more specific OPTIONS handler for tickets endpoint with query parameters
app.options('/api/tickets*', (req, res) => {
  console.log('Handling OPTIONS request for tickets');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Max-Age', '86400');
  res.status(204).end();
  console.log('Sent OPTIONS response');
});

// Add dashboard endpoints before other routes
app.get('/api/dashboard/stats', (req, res) => {
  console.log('Fetching dashboard stats');
  try {
    // Ensure mockTickets exists
    if (!Array.isArray(mockTickets)) {
      throw new Error('Mock tickets not initialized');
    }

    // Sort tickets by update date
    const sortedTickets = [...mockTickets].sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    const stats = {
      totalTickets: mockTickets.length,
      openTickets: mockTickets.filter(t => t.status === 'OPEN').length,
      inProgressTickets: mockTickets.filter(t => t.status === 'IN_PROGRESS').length,
      resolvedTickets: mockTickets.filter(t => t.status === 'RESOLVED').length,
      closedTickets: mockTickets.filter(t => t.status === 'CLOSED').length,
      
      ticketsByPriority: {
        low: mockTickets.filter(t => t.priority === 'LOW').length,
        medium: mockTickets.filter(t => t.priority === 'MEDIUM').length,
        high: mockTickets.filter(t => t.priority === 'HIGH').length,
        urgent: mockTickets.filter(t => t.priority === 'URGENT').length,
      },
      
      averageResolutionTime: 24,
      averageResponseTime: 2,
      customerSatisfaction: 4.5,
      
      agentPerformance: [
        { agentId: '1', agentName: 'Support Agent', ticketsResolved: 15, averageResolutionTime: 20 },
        { agentId: '2', agentName: 'Help Team', ticketsResolved: 12, averageResolutionTime: 22 },
        { agentId: '3', agentName: 'Service Desk', ticketsResolved: 8, averageResolutionTime: 18 }
      ],
      
      recentActivity: sortedTickets.slice(0, 5)
    };

    console.log('Sending dashboard stats:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: error.message 
    });
  }
});

// Add OPTIONS handler for dashboard endpoints
app.options('/api/dashboard/*', (req, res) => {
  console.log('Handling OPTIONS request for dashboard');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Max-Age', '86400');
  res.status(204).end();
  console.log('Sent OPTIONS response for dashboard');
});

const server = createServer(app);
const wss = new WebSocketServer({ 
  server,
  // Add ping interval to keep connections alive
  clientTracking: true,
  pingInterval: 30000, // Ping every 30 seconds
  pingTimeout: 10000   // Wait 10 seconds for pong
});

// Track subscriptions with cleanup
const subscriptions = new Map();
const clients = new Map();

function heartbeat() {
  this.isAlive = true;
}

wss.on('connection', (ws) => {
  console.log('New client connected');
  
  // Setup connection tracking
  ws.isAlive = true;
  ws.id = Date.now().toString();
  clients.set(ws.id, ws);
  
  // Setup heartbeat
  ws.on('pong', heartbeat);
  
  const clientSubscriptions = new Set();

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received:', data);
      
      switch (data.type) {
        case 'subscribe':
          if (!subscriptions.has(data.topic)) {
            subscriptions.set(data.topic, new Set());
          }
          subscriptions.get(data.topic).add(ws);
          clientSubscriptions.add(data.topic);
          // Send confirmation
          ws.send(JSON.stringify({ 
            type: 'subscribed', 
            topic: data.topic 
          }));
          break;
          
        case 'unsubscribe':
          if (subscriptions.has(data.topic)) {
            subscriptions.get(data.topic).delete(ws);
            clientSubscriptions.delete(data.topic);
            // Send confirmation
            ws.send(JSON.stringify({ 
              type: 'unsubscribed', 
              topic: data.topic 
            }));
          }
          break;
          
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
          
        default:
          // Handle regular messages
          if (data.topic && subscriptions.has(data.topic)) {
            // Broadcast to all subscribers of this topic
            subscriptions.get(data.topic).forEach((client) => {
              if (client.readyState === ws.OPEN) {
                client.send(JSON.stringify({
                  topic: data.topic,
                  payload: data.payload
                }));
              }
            });
          }
      }
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Invalid message format' 
      }));
    }
  });

  ws.on('close', () => {
    // Cleanup
    clients.delete(ws.id);
    clientSubscriptions.forEach(topic => {
      if (subscriptions.has(topic)) {
        subscriptions.get(topic).delete(ws);
        // Cleanup empty subscription sets
        if (subscriptions.get(topic).size === 0) {
          subscriptions.delete(topic);
        }
      }
    });
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws.id);
  });
});

// Implement periodic ping to keep connections alive
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      clients.delete(ws.id);
      return ws.terminate();
    }
    
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

// Cleanup on server shutdown
wss.on('close', () => {
  clearInterval(interval);
});

// Mock data for testing
mockTickets = Array.from({ length: 20 }, (_, i) => {
  const createdAt = randomDate(new Date(2023, 0, 1), new Date());
  return {
    id: (i + 1).toString(),
    title: `Test Ticket ${i + 1}`,
    description: `Description for ticket ${i + 1}`,
    priority: randomChoice(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    status: randomChoice(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
    createdAt,
    updatedAt: randomDate(createdAt, new Date()),
    customer: { 
      id: `user${Math.floor(Math.random() * 5) + 1}`,
      firstName: randomChoice(['John', 'Jane', 'Bob', 'Alice', 'Charlie']), 
      lastName: randomChoice(['Doe', 'Smith', 'Johnson', 'Williams', 'Brown']),
      email: 'customer@example.com'
    },
    assignee: Math.random() > 0.3 ? {
      id: `agent${Math.floor(Math.random() * 3) + 1}`,
      firstName: randomChoice(['Support', 'Help', 'Service']),
      lastName: randomChoice(['Agent', 'Team', 'Desk']),
      email: 'agent@example.com'
    } : null
  };
});

app.get('/api/tickets', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = (req.query.sortOrder || 'desc').toLowerCase();
    const search = req.query.search || '';
    
    console.log('Fetching tickets with params:', { page, limit, sortBy, sortOrder, search });
    
    // Filter tickets
    let filteredTickets = [...mockTickets];
    if (search) {
      filteredTickets = mockTickets.filter(ticket => 
        ticket.title.toLowerCase().includes(search.toLowerCase()) ||
        ticket.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Sort tickets
    const sortedTickets = filteredTickets.sort((a, b) => {
      const factor = sortOrder === 'asc' ? 1 : -1;
      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
        return factor * (new Date(a[sortBy]).getTime() - new Date(b[sortBy]).getTime());
      }
      return factor * String(a[sortBy]).localeCompare(String(b[sortBy]));
    });

    // Paginate tickets
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTickets = sortedTickets.slice(startIndex, endIndex);

    const totalItems = filteredTickets.length;
    const totalPages = Math.ceil(totalItems / limit);

    // Ensure consistent response format
    const response = {
      data: paginatedTickets,
      page: page,
      limit: limit,
      total: totalItems,
      totalPages: totalPages
    };

    console.log('Sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      details: error.message
    });
  }
});

// Add tickets endpoint
app.post('/api/tickets', (req, res) => {
  console.log('Received POST request for tickets:', req.body);
  try {
    const body = req.body;
    
    // Validate required fields
    if (!body.title || !body.description || !body.priority) {
      console.log('Missing required fields:', body);
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate priority
    if (!['LOW', 'MEDIUM', 'HIGH',"URGENT"].includes(body.priority)) {
      return res.status(400).json({ error: 'Invalid priority value' });
    }

    const ticket = {
      id: Date.now().toString(),
      title: body.title,
      description: body.description,
      priority: body.priority,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockTickets.unshift(ticket);
    console.log('Created new ticket:', ticket);

    // Broadcast new ticket to all subscribers
    if (subscriptions.has('tickets')) {
      subscriptions.get('tickets').forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            topic: 'tickets',
            payload: ticket
          }));
        }
      });
    }

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Add single ticket endpoint
app.get('/api/tickets/:id', (req, res) => {
  try {
    const ticket = mockTickets.find(t => t.id === req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.json(ticket);
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update ticket endpoint
app.put('/api/tickets/:id', (req, res) => {
  try {
    const ticketIndex = mockTickets.findIndex(t => t.id === req.params.id);
    if (ticketIndex === -1) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const body = req.body;
    if (!body.title || !body.description || !body.priority) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['LOW', 'MEDIUM', 'HIGH'].includes(body.priority)) {
      return res.status(400).json({ error: 'Invalid priority value' });
    }

    const updatedTicket = {
      ...mockTickets[ticketIndex],
      ...body,
      updatedAt: new Date()
    };

    mockTickets[ticketIndex] = updatedTicket;

    // Broadcast update to subscribers
    if (subscriptions.has('tickets')) {
      subscriptions.get('tickets').forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            topic: 'tickets',
            type: 'update',
            payload: updatedTicket
          }));
        }
      });
    }

    res.json(updatedTicket);
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete ticket endpoint
app.delete('/api/tickets/:id', (req, res) => {
  try {
    const ticketIndex = mockTickets.findIndex(t => t.id === req.params.id);
    if (ticketIndex === -1) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const deletedTicket = mockTickets[ticketIndex];
    mockTickets.splice(ticketIndex, 1);

    // Broadcast deletion to subscribers
    if (subscriptions.has('tickets')) {
      subscriptions.get('tickets').forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            topic: 'tickets',
            type: 'delete',
            payload: { id: req.params.id }
          }));
        }
      });
    }

    res.status(200).json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update ticket status endpoint
app.put('/api/tickets/:id/status', (req, res) => {
  try {
    const ticketIndex = mockTickets.findIndex(t => t.id === req.params.id);
    if (ticketIndex === -1) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const { status } = req.body;
    if (!['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const updatedTicket = {
      ...mockTickets[ticketIndex],
      status,
      updatedAt: new Date()
    };

    mockTickets[ticketIndex] = updatedTicket;

    // Broadcast status update to subscribers
    if (subscriptions.has('tickets')) {
      subscriptions.get('tickets').forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            topic: 'tickets',
            type: 'status',
            payload: updatedTicket
          }));
        }
      });
    }

    res.json(updatedTicket);
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
