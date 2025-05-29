# ---- Production Stage ----
    FROM node:18-slim

    WORKDIR /app
    
    # Copy necessary files from the builder stage
    COPY --from=builder /app/package*.json ./
    COPY --from=builder /app/dist ./dist
    COPY --from=builder /app/server ./server
    COPY --from=builder /app/node_modules ./node_modules
    
    ENV NODE_ENV=production
    
    EXPOSE 8080
    
    CMD ["node", "server/index.js"]    