# Developer Onboarding Guide

Welcome to the Homework Supply project! This guide will take you from zero knowledge to being a functional contributor to our elearning platform.

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Prerequisites](#prerequisites)
3. [Development Environment Setup](#development-environment-setup)
4. [AWS Setup](#aws-setup)
5. [Local Development](#local-development)
6. [Testing](#testing)
7. [Development Workflow](#development-workflow)
8. [Architecture Overview](#architecture-overview)
9. [Key Concepts](#key-concepts)
10. [Getting Help](#getting-help)

## 🎯 Project Overview

Homework Supply is a web application for interactive Japanese language learning assignments. Built with:

- **Frontend**: Next.js, React, Material UI
- **Backend**: AWS Amplify Gen 1 (GraphQL API, Authentication, Storage)
- **Language**: Mixed JavaScript/TypeScript (transitioning to TypeScript)
- **Database**: AWS DynamoDB (via Amplify DataStore)
- **Storage**: AWS S3 (for audio, images, videos)
- **AI Integration**: OpenAI API for content generation and grading

### Key Features
- Interactive assignments with audio/image processing
- Real-time LLM feedback and grading
- User progress tracking
- Japanese vocabulary management
- Group/section management for instructors
- Mobile-responsive design

## ✅ Prerequisites

### Required Knowledge (We'll help you learn these)
- Basic JavaScript/React fundamentals
- HTML/CSS basics
- Git version control
- Command line basics

### Software Requirements
- **Node.js** (v16 or later) - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)
- **VS Code** (recommended) - [Download here](https://code.visualstudio.com/)
- **AWS CLI** - [Installation guide](https://aws.amazon.com/cli/)

### Accounts Needed
- GitHub account (for code access)
- AWS account access (will be provided)
- OpenAI API access (for AI features)

## 🔧 Development Environment Setup

### 1. Clone the Repository
```bash
git clone https://github.com/ExcitingTheory/amplify-homework-supply.git
cd amplify-homework-supply
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Install Amplify CLI
```bash
npm install -g @aws-amplify/cli
```

## ☁️ AWS Setup

### 1. AWS SSO Login
You'll need to log into AWS SSO using a specific URL that will be provided to you:

```bash
# The URL will be filled in by your supervisor
# Example: https://your-organization.awsapps.com/start
# Open this URL in your browser and follow the SSO login process
```

**Note**: Your supervisor will provide you with:
- The specific AWS SSO URL for our organization
- Your temporary credentials or login instructions
- The appropriate AWS profile configuration

### 2. Configure AWS CLI
After SSO login, configure your local AWS CLI:

```bash
aws configure sso
# Follow the prompts with information provided by your supervisor
```

### 3. Initialize Amplify
```bash
amplify configure
amplify init
# Choose existing environment when prompted
# Select 'dev' environment for development
```

### 4. Pull Backend Configuration
```bash
amplify pull
```

## 💻 Local Development

### 1. Start Development Server
```bash
npm run dev
```
Navigate to `http://localhost:3000`

### 2. Key Development Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run cypress:open

# Deploy backend changes
npm run build:amplify:dev

# Lint code
npm run lint
```

### 3. Environment Variables
Create a `.env.local` file (will be gitignored):
```bash
# OpenAI API configuration
OPENAI_API_KEY=your_api_key_here

# Add any other local development variables
```

## 🧪 Testing

### Cypress E2E Testing
```bash
# Open Cypress test runner
npm run cypress:open

# Run tests headlessly
npx cypress run
```

Current test coverage is limited - expanding test coverage is a priority item.

## 🔄 Development Workflow

### 1. Branch Strategy
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Work on your changes
git add .
git commit -m "Clear, descriptive commit message"

# Push and create PR
git push origin feature/your-feature-name
```

### 2. Code Standards
- Use meaningful variable and function names
- Add comments for complex logic
- Follow existing code patterns
- Test your changes locally before pushing

### 3. Pull Request Process
1. Create descriptive PR title and description
2. Link any related issues
3. Request review from team members
4. Address review feedback
5. Merge after approval

## 🏗️ Architecture Overview

### Frontend Structure
```
pages/           # Next.js pages (routing)
├── index.js     # Home page
├── units.js     # Unit listing
├── grades.js    # Grade management
└── workbook/    # Assignment pages

src/
├── components/  # Reusable React components
├── context/     # React Context providers
├── graphql/     # GraphQL queries/mutations
├── models/      # Data models
└── utils/       # Utility functions
```

### Backend (AWS Amplify)
```
amplify/
├── api/         # GraphQL API schema
├── auth/        # Authentication configuration
├── function/    # Lambda functions
└── storage/     # S3 storage configuration
```

### Key Data Models
- **Unit**: Learning modules containing questions/content
- **Assignment**: Units assigned to students with due dates
- **Grade**: Student submissions and performance data
- **Section**: Groups of students (classes)
- **Word**: Japanese vocabulary entries

## 🔑 Key Concepts

### 1. AWS Amplify DataStore
We use Amplify DataStore for real-time data sync:
```javascript
import { DataStore } from 'aws-amplify';
import { Unit } from '../models';

// Query data
const units = await DataStore.query(Unit);

// Create new record
await DataStore.save(new Unit({ name: "New Unit" }));
```

### 2. File Management
Audio, image, and video files are stored in S3:
```javascript
import { Storage } from 'aws-amplify';

// Upload file
const result = await Storage.put('filename.jpg', file);

// Get file URL
const url = await Storage.get('filename.jpg');
```

### 3. Authentication
User auth with Cognito:
```javascript
import { Auth } from 'aws-amplify';

// Get current user
const user = await Auth.currentAuthenticatedUser();

// Check user groups
const groups = user.signInUserSession.accessToken.payload['cognito:groups'];
```

### 4. AI Integration
OpenAI integration for content generation and grading:
- Content generation from text prompts
- Audio transcription and comparison
- Image analysis and feedback
- Automated grading based on expected answers

## 📚 Learning Resources

### Essential Reading
1. [Next.js Documentation](https://nextjs.org/docs) - Our frontend framework
2. [React Documentation](https://reactjs.org/docs) - UI library
3. [AWS Amplify Docs](https://docs.amplify.aws/) - Our backend platform
4. [Material UI](https://mui.com/) - Our component library

### Recommended Learning Path
1. **Week 1**: Familiarize with codebase, run local environment
2. **Week 2**: Understand data models and basic CRUD operations
3. **Week 3**: Work on small bug fixes and feature additions
4. **Week 4**: Take on more complex features

## 🆘 Getting Help

### When You're Stuck
1. **Check existing code** - Look for similar implementations
2. **Read documentation** - Check AWS Amplify and Next.js docs
3. **Search issues** - Look for similar problems in GitHub issues
4. **Ask questions** - Don't hesitate to reach out!

### Communication Channels
- **Slack/Teams**: Daily questions and quick help
- **GitHub Issues**: Bug reports and feature requests
- **Code Reviews**: Learning opportunities in PRs
- **Weekly Sync**: Regular check-ins with team

### Common Issues and Solutions
See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common problems and their solutions.

## 🎯 Next Steps

1. **Complete setup** following this guide
2. **Review the codebase** - Start with simple pages like `pages/index.js`
3. **Read project roadmap** - [ROADMAP.md](./ROADMAP.md)
4. **Pick up first issue** - Look for "good first issue" labels
5. **Join team meetings** - Get familiar with current priorities

## 📄 Additional Documentation

- [Project Roadmap](./ROADMAP.md) - Future plans and priorities
- [Troubleshooting Guide](./TROUBLESHOOTING.md) - Common issues
- [API Documentation](./API.md) - Backend API details
- [Contributing Guidelines](../CONTRIBUTING.md) - Code standards
- [TypeScript Migration Guide](./TYPESCRIPT_MIGRATION.md) - TS transition plan

Welcome to the team! 🎉