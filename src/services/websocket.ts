export class WebSocketService {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private subscriptions: Map<string, Set<(message: any) => void>> = new Map();
  private messageQueue: any[] = [];

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      this.ws = new WebSocket('ws://localhost:3001');

      this.ws.onopen = () => {
        console.log('WebSocket Connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.processMessageQueue();
      };

      this.ws.onclose = () => {
        console.log('WebSocket Disconnected');
        this.isConnected = false;
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

    } catch (error) {
      console.error('Connection error:', error);
    }
  }

  private processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.send(message, false);
    }
  }

  private handleMessage(data: any) {
    // Route message to appropriate subscribers
    const { topic, payload } = data;
    if (topic && this.subscriptions.has(topic)) {
      this.subscriptions.get(topic)?.forEach(callback => callback(payload));
    }
  }

  public subscribe(topic: string, callback: (message: any) => void): () => void {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set());
    }
    
    this.subscriptions.get(topic)?.add(callback);

    // Send subscription request to server
    this.send({
      type: 'subscribe',
      topic
    });

    // Return unsubscribe function
    return () => {
      this.subscriptions.get(topic)?.delete(callback);
      if (this.subscriptions.get(topic)?.size === 0) {
        this.subscriptions.delete(topic);
        this.send({
          type: 'unsubscribe',
          topic
        });
      }
    };
  }

  public subscribeToTicketUpdates(ticketId: string, callback: (message: any) => void) {
    return this.subscribe(`/topic/ticket/${ticketId}`, callback);
  }

  public subscribeToUserNotifications(userId: string, callback: (message: any) => void) {
    return this.subscribe(`/topic/user/${userId}`, callback);
  }

  public subscribeToGlobalNotifications(callback: (message: any) => void) {
    return this.subscribe('/topic/global', callback);
  }

  public send(message: any, queue: boolean = true) {
    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else if (queue) {
      console.warn('WebSocket is not connected, queueing message');
      this.messageQueue.push(message);
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

export const webSocketService = new WebSocketService();
