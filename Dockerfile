FROM node:18-alpine

WORKDIR /app

# Copy entire recipe-app directory
COPY recipe-app ./

# Install dependencies
RUN npm install

# Build frontend
RUN npm run build

# Expose port 3001 (Express server)
EXPOSE 3001

# Start Express server
CMD ["npm", "start"]
