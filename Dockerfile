FROM node:18-alpine

WORKDIR /app

# Copy recipe-app package files
COPY recipe-app/package*.json ./

# Install dependencies
RUN npm install

# Copy recipe-app source code
COPY recipe-app/src ./src
COPY recipe-app/server ./server
COPY recipe-app/index.html ./
COPY recipe-app/vite.config.js ./
COPY recipe-app/tailwind.config.js ./

# Build frontend
RUN npm run build

# Expose port 3001 (Express server)
EXPOSE 3001

# Start Express server
CMD ["npm", "start"]
