import { useEffect } from 'react';
import { useAppDispatch } from './useAppDispatch';
import { updateTicketRealtime } from '../store/slices/ticketsSlice';
import wsService from '../services/WebSocketService';

export const useWebSocket = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const handleTicketUpdate = (data: any) => {
      if (data.type === 'update' || data.type === 'create') {
        dispatch(updateTicketRealtime(data.payload));
      }
    };

    wsService.connect().catch(console.error);
    wsService.subscribe('tickets', handleTicketUpdate);

    return () => {
      wsService.unsubscribe('tickets', handleTicketUpdate);
      wsService.disconnect();
    };
  }, [dispatch]);
};
