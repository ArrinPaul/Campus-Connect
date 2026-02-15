# 🎓 Campus Connect

> **Connect. Collaborate. Create.**

A next-generation academic social platform built with Next.js 14, Clerk, Convex, and deployed on Vercel.

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-purple)](https://clerk.com/)
[![Convex](https://img.shields.io/badge/Convex-Database-orange)](https://convex.dev/)
[![Vercel](https://img.shields.io/badge/Vercel-Deploy-black)](https://vercel.com/)

---

## 🌟 What is Campus Connect?

Campus Connect is a comprehensive platform designed for students, researchers, and academics to:

- 🤝 **Connect** with peers based on skills and interests
- 💬 **Collaborate** through real-time messaging and groups
- 🏆 **Compete** in hackathons and showcase projects
- 📚 **Learn** through resources and mentorship
- 🎯 **Grow** with gamification and achievements

---

## ✨ Key Features

### 🔐 Authentication & Profiles
- Secure authentication with Clerk
- Social logins (Google, GitHub, LinkedIn)
- Comprehensive user profiles
- Skill-based matching
- Role-based access (Student, Researcher, Faculty)

### 📱 Social Networking
- Real-time feed with posts
- Like, comment, and share
- Follow/unfollow system
- Friend requests
- Skill-based recommendations

### 💬 Communication
- Direct messaging
- Group chats
- Real-time notifications
- Email notifications
- Typing indicators

### 🏆 Hackathons & Teams
- Create and manage hackathons
- Form teams with skill matching
- Project submissions
- Judging system
- Awards and certificates

### 🤖 AI-Powered Features
- Smart recommendations
- Content suggestions
- Team matching
- AI assistant
- Code review help

### 📚 Learning & Growth
- Resource library
- Learning paths
- Mentorship matching
- Progress tracking
- Skill development

### 🎮 Gamification
- Points and rewards
- Badges and achievements
- Leaderboards
- Challenges
- Daily quests

---

## 🚀 Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui
- **State:** Zustand + React Query
- **Forms:** React Hook Form + Zod

### Backend
- **Database:** Convex (Real-time)
- **File Storage:** Convex Storage
- **Server Logic:** Convex Actions

### Authentication
- **Provider:** Clerk
- **Features:** Social logins, Organizations, User management

### Deployment
- **Platform:** Vercel
- **Edge:** Vercel Edge Functions
- **Analytics:** Vercel Analytics

### Additional Services
- **Email:** Resend
- **AI:** OpenAI API
- **Monitoring:** Sentry (planned)

---

## 📚 Documentation

Comprehensive documentation is available:

1. **[Quick Start Guide](CAMPUS_CONNECT_QUICKSTART.md)** - Get started in 30 minutes
2. **[Project Roadmap](CAMPUS_CONNECT_ROADMAP.md)** - 20-week development plan
3. **[Task List](CAMPUS_CONNECT_TASKS.md)** - Detailed task breakdown
4. **[Architecture](CAMPUS_CONNECT_ARCHITECTURE.md)** - Technical architecture
5. **[Summary](CAMPUS_CONNECT_SUMMARY.md)** - Project overview

---

## 🏃 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Git
- Accounts: Clerk, Convex, Vercel (all free tier)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/campus-connect.git
cd campus-connect

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Add your API keys to .env.local

# Initialize Convex
npx convex dev

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Environment Variables

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# Convex
NEXT_PUBLIC_CONVEX_URL=
CONVEX_DEPLOY_KEY=

# OpenAI (optional)
OPENAI_API_KEY=

# Resend (optional)
RESEND_API_KEY=
```

---

## 📖 Development Guide

### Project Structure

```
campus-connect/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # React components
│   ├── convex/          # Convex backend
│   ├── lib/             # Utilities
│   ├── hooks/           # Custom hooks
│   └── types/           # TypeScript types
├── public/              # Static assets
└── convex/              # Convex configuration
```

### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write code
   - Add tests
   - Update documentation

3. **Test your changes**
   ```bash
   npm run test
   npm run lint
   ```

4. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: add your feature"
   git push origin feature/your-feature-name
   ```

5. **Create a pull request**

### Code Style

- Use TypeScript strictly
- Follow ESLint rules
- Format with Prettier
- Write meaningful commit messages
- Add comments for complex logic

---

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Check test coverage
npm run test:coverage
```

---

## 🚀 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Deploy Convex

```bash
# Deploy Convex backend
npx convex deploy
```

---

## 📊 Project Status

### Current Phase: Foundation (Week 1-4)

- [x] Project setup
- [x] Clerk authentication
- [x] Convex database
- [ ] User profiles
- [ ] Posts system
- [ ] Feed display
- [ ] Connections

### Upcoming Phases

- **Phase 2 (Week 5-8):** Social features
- **Phase 3 (Week 9-12):** Hackathons & teams
- **Phase 4 (Week 13-16):** Advanced features
- **Phase 5 (Week 17-20):** Polish & launch

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

### Contribution Guidelines

- Follow the code style
- Write clear commit messages
- Add tests for new features
- Update documentation
- Be respectful and collaborative

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

- **Project Lead:** Your Name
- **Developers:** Team members
- **Designers:** Design team
- **Contributors:** [All contributors](https://github.com/yourusername/campus-connect/graphs/contributors)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Clerk](https://clerk.com/) - Authentication made easy
- [Convex](https://convex.dev/) - Real-time backend
- [Vercel](https://vercel.com/) - Deployment platform
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS

---

## 📞 Support

- **Documentation:** See docs folder
- **Issues:** [GitHub Issues](https://github.com/yourusername/campus-connect/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/campus-connect/discussions)
- **Email:** support@campusconnect.com

---

## 🗺️ Roadmap

### Q1 2024: Foundation
- ✅ Project setup
- ✅ Authentication
- ✅ Database setup
- 🔄 Core features

### Q2 2024: Growth
- 📅 Social features
- 📅 Hackathons
- 📅 Teams
- 📅 Projects

### Q3 2024: Advanced
- 📅 AI integration
- 📅 Learning platform
- 📅 Events
- 📅 Gamification

### Q4 2024: Scale
- 📅 Mobile app
- 📅 Enterprise features
- 📅 API marketplace
- 📅 International expansion

---

## 📈 Stats

![GitHub stars](https://img.shields.io/github/stars/yourusername/campus-connect?style=social)
![GitHub forks](https://img.shields.io/github/forks/yourusername/campus-connect?style=social)
![GitHub issues](https://img.shields.io/github/issues/yourusername/campus-connect)
![GitHub pull requests](https://img.shields.io/github/issues-pr/yourusername/campus-connect)

---

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=yourusername/campus-connect&type=Date)](https://star-history.com/#yourusername/campus-connect&Date)

---

## 💖 Support the Project

If you find Campus Connect useful, please consider:

- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting features
- 📝 Contributing code
- 📢 Sharing with others

---

## 📱 Screenshots

*Coming soon...*

---

## 🎯 Mission

Our mission is to revolutionize academic collaboration by providing a modern, intuitive platform that connects students, researchers, and academics worldwide.

---

## 🔗 Links

- **Website:** https://campusconnect.com (coming soon)
- **Documentation:** [Docs](./docs)
- **Blog:** https://blog.campusconnect.com (coming soon)
- **Twitter:** [@CampusConnect](https://twitter.com/campusconnect)
- **LinkedIn:** [Campus Connect](https://linkedin.com/company/campus-connect)

---

<div align="center">

**Built with ❤️ by the Campus Connect team**

[Website](https://campusconnect.com) • [Documentation](./docs) • [Twitter](https://twitter.com/campusconnect)

</div>
