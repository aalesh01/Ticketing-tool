import { NextResponse } from 'next/server';
import { Ticket } from '@/types/ticket';

// Add OPTIONS method to handle CORS preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { 
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}

export async function POST(request: Request) {
  // Add CORS headers to the response
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.description || !body.priority) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate priority
    if (!['LOW', 'MEDIUM', 'HIGH'].includes(body.priority)) {
      return NextResponse.json(
        { error: 'Invalid priority value' },
        { status: 400 }
      );
    }

    const ticket: Ticket = {
      id: Date.now().toString(), // Simple ID generation, consider using UUID in production
      title: body.title,
      description: body.description,
      priority: body.priority,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Here you would typically save the ticket to a database
    // For now, we'll just return the created ticket
    
    return NextResponse.json(ticket, { 
      status: 201,
      headers
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { 
        status: 500,
        headers
      }
    );
  }
}
