# ---- Build Stage ----
    FROM node:18 AS builder

    # Set working directory
    WORKDIR /app
    
    # Copy dependency files
    COPY package*.json ./
    
    # Install dependencies
    RUN npm install
    
    # Copy the entire project
    COPY . .
    
    # Build the frontend (assumes Vite is configured)
    RUN npm run build
    
    # ---- Production Stage ----
    FROM node:18-slim
    
    # Set working directory
    WORKDIR /app
    
    # Copy only the necessary files from the builder
    COPY --from=builder /app/package*.json ./
    COPY --from=builder /app/dist ./dist
    COPY --from=builder /app/server ./server  # assuming backend code is in /server
    COPY --from=builder /app/node_modules ./node_modules
    
    # Set environment variable for production
    ENV NODE_ENV=production
    
    # Expose the backend port
    EXPOSE 3001
    
    # Start the backend (assumes you have a server entry in /server/index.js)
    CMD ["node", "server/index.js"]    