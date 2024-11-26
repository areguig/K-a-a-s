# Use Node.js with Java
FROM eclipse-temurin:17-jdk-jammy as base

# Install Node.js
RUN apt-get update && apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Set environment variable for port
ENV PORT=3000

# Expose port
EXPOSE ${PORT}

# Start the application
CMD ["npm", "run", "start:prod"]
