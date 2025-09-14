# NeoLearn - AI-Powered Learning Platform

A beautiful, modern web application that transforms your learning experience with AI-powered tools. Upload your course materials and get personalized quizzes, flashcards, and interactive learning sessions.

## Features

### 🎯 Core Features
- **AI Learning**: Upload PDF materials and chat with an AI tutor that understands your content
- **AI Quiz**: Generate personalized quizzes from your materials to test your knowledge
- **AI Flashcards**: Create smart flashcards to help you memorize key concepts faster
- **JWT Authentication**: Secure user authentication with Supabase integration
- **Responsive Design**: Beautiful, modern UI that works on all devices

### 🚀 Key Highlights
- **PDF Upload**: Drag and drop PDF files for processing
- **Real-time Chat**: Interactive AI tutor for learning assistance
- **Smart Quizzes**: AI-generated questions with multiple difficulty levels
- **Progress Tracking**: Monitor your learning progress and performance
- **Modern UI**: Beautiful gradients, animations, and responsive design

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Authentication**: Supabase + JWT
- **State Management**: React Context API
- **Form Handling**: React Hook Form + Zod

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd neolearn
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   JWT_SECRET=your_jwt_secret_here
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Enable authentication in your Supabase dashboard
   - Copy your project URL and anon key to the environment variables

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
neolearn/
├── app/
│   ├── api/auth/          # Authentication API routes
│   ├── ai-learning/       # AI Learning page
│   ├── ai-quiz/          # AI Quiz page
│   ├── ai-flashcards/    # AI Flashcards page
│   ├── signin/           # Sign in page
│   ├── signup/           # Sign up page
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/
│   ├── AuthGuard.tsx     # Authentication guard
│   ├── Header.tsx        # Navigation header
│   └── Footer.tsx        # Footer component
├── contexts/
│   └── AuthContext.tsx   # Authentication context
├── lib/
│   ├── auth.ts          # Authentication utilities
│   └── supabase.ts      # Supabase client
└── public/              # Static assets
```

## Features Overview

### 🔐 Authentication
- JWT-based authentication with Supabase
- Secure sign in/sign up forms
- Protected routes with authentication guards
- User session management

### 📚 AI Learning
- Upload PDF course materials
- Interactive chat interface with AI tutor
- Real-time message processing
- File management and organization

### 📝 AI Quiz
- Generate quizzes from uploaded materials
- Multiple choice questions
- Timer functionality
- Score tracking and results
- Detailed explanations for answers

### 🧠 AI Flashcards
- Create flashcards from course content
- Difficulty levels (easy, medium, hard)
- Category organization
- Progress tracking
- Shuffle functionality

## Customization

### Styling
The application uses Tailwind CSS for styling. You can customize:
- Colors in `tailwind.config.js`
- Global styles in `app/globals.css`
- Component-specific styles in individual files

### AI Integration
To connect with real AI services:
1. Update the API endpoints in the respective pages
2. Replace mock data with actual AI service calls
3. Add error handling for API failures

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@neolearn.com or create an issue in the repository.

---

Built with ❤️ for better learning experiences.