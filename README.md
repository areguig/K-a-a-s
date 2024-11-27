# Karate as a Service (KaaS)

A modern web application that provides a user-friendly interface for writing and executing [Karate](https://github.com/karatelabs/karate) API tests. Write, run, and debug your Karate tests directly in the browser with real-time feedback and syntax highlighting.

## Features

- 🌐 Modern web interface for Karate testing
- ✨ Real-time Gherkin syntax highlighting
- 🎯 Immediate test execution feedback
- 🔍 Failed step highlighting in the editor
- 📊 Detailed test results and logs
- 🚀 Easy to deploy and use

## Prerequisites

### System Requirements
- Docker and Docker Compose (for containerized deployment)
- Java 21 (for local development)
- Node.js 18 or higher (for local development)
- npm or yarn (for local development)

### Client Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Project Structure

```
K-a-a-S/
├── api-java/           # Backend Quarkus application
│   ├── src/
│   │   └── main/
│   │       └── java/
│   │           └── com/
│   │               └── kaas/
│   │                   ├── model/     # Data models
│   │                   ├── resource/  # REST endpoints
│   │                   └── service/   # Business logic
│   ├── Dockerfile
│   └── pom.xml
│
├── ui/                # Frontend Next.js application
│   ├── src/
│   │   ├── app/      # Pages and layouts
│   │   ├── components/ # React components
│   │   └── services/ # API services
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml # Container orchestration
└── Makefile          # Development commands
```

## Quick Start with Docker

The easiest way to run KaaS is using Docker Compose:

```bash
# Clone the repository
git clone https://github.com/areguig/K-a-a-S.git
cd K-a-a-S

# Start the services
make up

# View logs
make logs
```

The application will be available at:
- UI: http://localhost:3000
- API: http://localhost:3001

## Local Development Setup

### Backend (Java API)

1. Navigate to the API directory:
```bash
cd api-java
```

2. Start the Quarkus application in dev mode:
```bash
./mvnw quarkus:dev
```

The API will be available at `http://localhost:3001`

### Frontend (Next.js UI)

1. Navigate to the UI directory:
```bash
cd ui
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The UI will be available at `http://localhost:3000`

## Available Make Commands

- `make up`: Start all services
- `make down`: Stop all services
- `make logs`: View service logs
- `make ps`: List running containers
- `make clean`: Clean up containers and images
- `make rebuild`: Rebuild and restart services

## Architecture

### Backend (Java API)
- Built with Quarkus 3.6.4
- Uses Java 21 with virtual threads
- Direct integration with Karate 1.4.0
- RESTful endpoints for test execution
- Real-time test result processing

### Frontend (Next.js UI)
- Built with Next.js and React
- Monaco editor with Gherkin syntax highlighting
- Real-time test execution feedback
- Failed step highlighting
- Configuration management

## API Endpoints

- `POST /karate/execute`: Execute a Karate test
  - Request body: Feature file content and configuration
  - Response: Test execution results

- `GET /karate/versions`: Get version information
  - Response: Karate and Java versions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
