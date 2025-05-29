import express from 'express';
import { validateToken } from '../middleware/auth';
import { ticketStore } from '../store/ticketStore';

const router = express.Router();

router.post('/', validateToken, async (req, res) => {
  try {
    const { title, description } = req.body;
    
    // Validate request body
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
    }

    // Create ticket in database
    const newTicket = ticketStore.createTicket({
      title,
      description,
      status: 'OPEN',
      userId: req.user.id, // Assuming user info is attached by validateToken middleware
    });

    return res.status(201).json({
      success: true,
      data: newTicket
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create ticket'
    });
  }
});

export default router;
