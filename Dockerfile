# Use official Node image
FROM node:18

# Set working directory
WORKDIR /app

# Copy dependency files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the project
COPY . .

# Expose Vite (5173) and backend (e.g., 5000) ports
EXPOSE 8080 3001

# Start both dev servers
CMD ["npm", "run", "dev"]
