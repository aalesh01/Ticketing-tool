# ---- Build Stage ----
    FROM node:18 AS builder

    WORKDIR /app
    
    COPY package*.json ./
    
    # Avoid peer dependency issues
    RUN npm install --legacy-peer-deps
    
    COPY . .
    
    RUN npm run build
    
    # ---- Production Stage ----
    FROM node:18-slim
    
    WORKDIR /app
    
    # Copy only what's needed
    COPY --from=builder /app/package*.json ./
    COPY --from=builder /app/dist ./dist
    COPY --from=builder /app/server ./server
    COPY --from=builder /app/node_modules ./node_modules
    
    ENV NODE_ENV=production
    
    EXPOSE 3001
    
    CMD ["node", "server/index.js"]    