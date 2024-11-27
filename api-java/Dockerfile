# Use Eclipse Temurin Java 21
FROM eclipse-temurin:21-jdk

# Set working directory
WORKDIR /app

# Copy Maven wrapper and POM
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Ensure Maven wrapper is executable
RUN chmod +x mvnw

# Copy source code
COPY src ./src/

# Download dependencies and build the application
RUN ./mvnw clean package -DskipTests

# Set environment variables
ENV JAVA_OPTS="\
    --enable-preview \
    -XX:+UnlockExperimentalVMOptions \
    -XX:+EnableVectorSupport \
    -XX:+UseZGC \
    -XX:+ZGenerational \
    -Xms64m \
    -Xmx256m \
    -XX:MaxRAMPercentage=80.0 \
    -XX:MinRAMPercentage=50.0 \
    -Dfile.encoding=UTF-8 \
    -Djava.awt.headless=true"

# Expose the application port
EXPOSE 3001

# Run the application
CMD ["java", "-jar", "target/quarkus-app/quarkus-run.jar"]
