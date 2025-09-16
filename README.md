# LeCodeR MVP

Transform research papers into functional code with AI-powered analysis and generation. **Now deployment-ready for Vercel + Supabase!**

## ✨ Features

- 📄 **PDF Upload**: Upload research papers for AI analysis
- 🤖 **AI Pipeline**: Multi-stage processing with concept extraction, algorithm analysis, and code generation
- 🔑 **BYOK (Bring Your Own Key)**: Users can add their own API keys for AI providers
- 🎯 **EmbeddingGemma**: Latest Google embeddings via Hugging Face
- 📊 **Real-time Progress**: WebSocket-based progress tracking
- 💾 **Supabase Integration**: Managed PostgreSQL database
- 🔒 **Anonymous Usage**: No registration required
- 📦 **Code Export**: Download generated code as ZIP packages

🚀 **Quick Deploy**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/lecoder-mvp)

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **Authentication**: Better Auth
- **AI SDK**: Vercel AI SDK
- **Embeddings**: Hugging Face EmbeddingGemma
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## 🌐 Production Deployment

### Required Environment Variables
```bash
# Database (Supabase)
DATABASE_URL="postgresql://..."

# App Configuration  
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="https://your-app.vercel.app"

# Hugging Face (Required for embeddings)
HUGGINGFACE_API_KEY="hf_your-token-here"
```

### Deploy to Vercel
```bash
npm i -g vercel
vercel --prod
```

📖 **See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment guide**

## 🛠 Local Development

```bash
# Clone and install
git clone <repo-url>
cd lecoder-mvp
npm install

# Set up environment
cp .env.example .env
# Edit with your config

# Database setup
npx prisma generate
npx prisma db push

# Start development
npm run dev
```

## 🚀 Build & Deployment

```bash
# Standard Next.js production build
npm run build

# Turbo-powered build with caching
npm run turbo:build
```

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