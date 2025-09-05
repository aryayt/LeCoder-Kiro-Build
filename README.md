# LeCodeR MVP

LeCodeR is an open-source web application that automatically transforms academic research papers into working code repositories using AI.

## 🚀 Features

- **PDF Upload & Processing**: Drag-and-drop interface with text extraction
- **6-Stage AI Pipeline**: Comprehensive analysis from concepts to code
- **Real-time Progress Tracking**: Live updates during processing
- **Complete Code Generation**: Executable repositories with no placeholders
- **Project Management**: Dashboard for tracking and downloading projects
- **Multi-LLM Support**: OpenAI, Google Gemini, and Claude integration

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS v4
- **Backend**: tRPC, Prisma ORM, PostgreSQL
- **Authentication**: Better Auth with Google/GitHub OAuth
- **AI**: Vercel AI SDK with multiple providers
- **Code Quality**: Biome (formatting & linting)
- **Build System**: Turborepo
- **Documentation**: Fumadocs
- **Testing**: Jest, React Testing Library

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- API keys for AI services (OpenAI, Google AI, Anthropic)

## 🏃‍♂️ Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/aryayt/LeCoder-Kiro-Build.git
cd LeCoder-Kiro-Build

# 2. Install dependencies
npm install

# 3. Set up environment (see setup guide for details)
cp .env.example .env
# Edit .env with your configuration

# 4. Start database and set up schema
./start-database.sh
npm run db:setup

# 5. Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

📖 **For detailed setup instructions including environment variables, see [Local Development Setup Guide](./docs/local-development-setup.md)**

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📚 Documentation

Full documentation is available at `/docs` or visit our [Fumadocs site](./docs).

## 🏗️ Architecture

LeCodeR follows a modern serverless architecture:

- **Frontend**: Next.js app router with React Server Components
- **API**: tRPC procedures with type-safe client-server communication
- **Database**: PostgreSQL with Prisma ORM for type safety
- **AI Pipeline**: Vercel AI SDK with streaming and error handling
- **Authentication**: Better Auth with session management

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests.

## 📞 Support

- Documentation: [/docs](./docs)
- Issues: [GitHub Issues](https://github.com/your-repo/issues)
- Discussions: [GitHub Discussions](https://github.com/your-repo/discussions)