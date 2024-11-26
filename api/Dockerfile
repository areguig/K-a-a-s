# Use GraalVM Java 21
FROM ghcr.io/graalvm/graalvm-community:21 as base

# Set environment variables for Java
ENV JAVA_OPTS="\
    --enable-preview \
    -XX:+UnlockExperimentalVMOptions \
    -XX:+EnableVectorSupport \
    -Djdk.virtualThreadScheduler.parallelism=32 \
    -Djdk.virtualThreadScheduler.maxPoolSize=256 \
    -Djava.util.concurrent.ForkJoinPool.common.parallelism=32 \
    -XX:+UseG1GC \
    -XX:+UseStringDeduplication \
    -XX:+OptimizeStringConcat \
    -XX:MaxGCPauseMillis=100 \
    -Dfile.encoding=UTF-8 \
    -Djava.awt.headless=true"

# Install Node.js and npm
RUN curl -fsSL https://rpm.nodesource.com/setup_18.x | bash - && \
    microdnf install -y nodejs && \
    microdnf clean all && \
    npm install -g npm@latest && \
    npm install -g @nestjs/cli

# Create app directory and lib directory
WORKDIR /app
RUN mkdir -p lib

# Download Karate JAR
RUN curl -L -o lib/karate.jar https://github.com/karatelabs/karate/releases/download/v1.4.0/karate-1.4.0.jar

# Create Java source directory and compile KarateServer
COPY src/main/java/KarateServer.java /app/src/main/java/
RUN mkdir -p classes && \
    javac -cp lib/karate.jar:/app/lib/* -d classes src/main/java/KarateServer.java && \
    jar uf lib/karate.jar -C classes .

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
CMD ["node", "dist/main"]
