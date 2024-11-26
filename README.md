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

### Server Requirements
- Java 11 or higher
- Node.js 18 or higher
- npm or yarn

### Client Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/areguig/K-a-a-S.git
cd K-a-a-S
```

2. Install dependencies:
```bash
# Install API dependencies
cd api
npm install

# Install Web dependencies
cd ../web
npm install
```

3. Set up environment variables:
```bash
# In /api/.env
PORT=3000
KARATE_VERSION=1.4.0 # the version of Karate that is in lib directory

# In /web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Running the Application

1. Start the API server:
```bash
cd api
npm run start:dev
```

2. Start the web interface:
```bash
cd web
npm run dev
```

3. Open your browser and navigate to `http://localhost:3001`

## How It Works

KaaS consists of two main components:

### Backend (API)
- Built with NestJS
- Manages Karate JAR file downloads and execution
- Handles test execution and result processing
- Provides version information and health checks

### Frontend (Web)
- Built with Next.js and React
- Features a Monaco-based editor with Gherkin syntax highlighting
- Real-time test execution and result display
- Failed step highlighting in the editor
- Configuration management

The application downloads and uses the official Karate JAR file to execute tests, ensuring compatibility with the latest Karate features.

## Architecture

```
K-a-a-S/
├── api/                 # Backend NestJS application
│   ├── src/
│   │   ├── karate/     # Karate service and controller
│   │   └── main.ts     # Application entry point
│   └── package.json
│
└── web/                # Frontend Next.js application
    ├── src/
    │   └── app/        # React components and pages
    └── package.json
```

## Development

### Adding New Features
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

### Code Style
- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write meaningful commit messages

## Production Deployment

1. Build the applications:
```bash
# Build API
cd api
npm run build

# Build Web
cd ../web
npm run build
```

2. Deploy using your preferred hosting service (e.g., Vercel, Heroku, AWS)

### Docker Support (Coming Soon)
Docker support is planned for easier deployment and development.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Karate](https://github.com/karatelabs/karate) - The awesome API testing tool that made this possible
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - The powerful code editor used in this project
- All contributors who help improve this project

## Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/areguig/K-a-a-S/issues) page
2. Create a new issue if your problem isn't already listed
3. Join our community discussions
