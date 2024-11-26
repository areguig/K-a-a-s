# Use GraalVM Java 21
FROM ghcr.io/graalvm/graalvm-community:21 as base

# Set environment variables for Java
ENV JAVA_OPTS="\
    --enable-preview \
    -XX:+UnlockExperimentalVMOptions \
    -XX:+EnableVectorSupport \
    -XX:+UseJVMCICompiler \
    -Djava.util.concurrent.ForkJoinPool.common.parallelism=32 \
    -XX:+UseG1GC \
    -XX:+UseStringDeduplication \
    -XX:MaxGCPauseMillis=100 \
    -Dfile.encoding=UTF-8 \
    -Djava.awt.headless=true"

# Install Node.js and npm
RUN curl -fsSL https://rpm.nodesource.com/setup_18.x | bash - && \
    microdnf install -y nodejs && \
    microdnf clean all && \
    npm install -g npm@latest && \
    npm install -g @nestjs/cli

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Clean up development dependencies
RUN npm prune --production && \
    npm uninstall -g @nestjs/cli

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Expose the port
EXPOSE $PORT

# Start the application
CMD ["npm", "run", "start:prod"]
