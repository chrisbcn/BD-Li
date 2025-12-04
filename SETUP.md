# Setup Guide

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

The app will open at `http://localhost:3000`

## Creating GitHub Repository

### Option 1: Using GitHub CLI (Recommended)

If you have GitHub CLI installed:

```bash
gh repo create task-management-app --private --source=. --remote=origin --push
```

### Option 2: Using GitHub Web Interface

1. Go to [GitHub](https://github.com/new)
2. Create a new repository:
   - Name: `task-management-app` (or your preferred name)
   - Description: "Frictionless personal task management app with recurring tasks"
   - Visibility: Private (recommended) or Public
   - **Do NOT** initialize with README, .gitignore, or license (we already have these)

3. After creating the repo, connect your local repository:

```bash
git remote add origin https://github.com/YOUR_USERNAME/task-management-app.git
git branch -M main
git push -u origin main
```

### Option 3: Using GitHub Desktop

1. Open GitHub Desktop
2. File → Add Local Repository
3. Select this directory
4. Publish repository to GitHub

## Environment Variables (Optional)

Currently, Supabase credentials are hardcoded in `src/utils/supabase/info.tsx`. For production:

1. Create a `.env` file:
```bash
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_SUPABASE_ANON_KEY=your-anon-key
```

2. Update `src/utils/supabase/info.tsx` to read from environment:
```typescript
export const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "arbfeygvxnksqhgbpfpc"
export const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "your-fallback-key"
```

## Next Steps

- [ ] Create GitHub repository
- [ ] Push code to GitHub
- [ ] Set up environment variables (if needed)
- [ ] Configure Supabase Edge Functions
- [ ] Deploy to production (Vercel, Netlify, etc.)

