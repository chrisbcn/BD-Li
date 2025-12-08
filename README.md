# Task Management App (Hoop)

A frictionless personal task management application inspired by the Hoop app interface. Features a 3-column Kanban board with recurring task logic where completed items automatically recycle back to the inbox after one week.

## Features

- **3-Column Kanban Board**: Incoming, To-do, and Done columns
- **Drag and Drop**: Seamless task movement between columns using `@dnd-kit`
- **Inline Editing**: Click task titles to edit directly on the card
- **Keyboard Shortcuts**:
  - `Cmd+Enter` (or `Ctrl+Enter`): Save changes during inline editing
  - `Esc`: Cancel editing
  - `N`: Add new task to To-do column
  - `D`: Toggle show/hide Done column
- **Recurring Tasks**: Tasks in Done column automatically move back to Incoming after 7 days
- **Minimalist Design**: Clean, white-space heavy interface optimized for speed

## Tech Stack

- **Frontend**: React 18, TypeScript
- **Styling**: Tailwind CSS
- **Drag & Drop**: `@dnd-kit/core`
- **Icons**: `lucide-react`
- **Backend**: Supabase (PostgreSQL database with Row Level Security)

## Prerequisites

- Node.js 18+ and npm (or yarn/pnpm)
- A Supabase account and project (for data persistence)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd "Task Management App"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase Database

**Important**: You need to set up the database schema before the app will work.

1. **Create a Supabase project** (if you haven't already):
   - Go to https://supabase.com and sign up/login
   - Create a new project

2. **Run the database migration**:
   - Open your Supabase project dashboard
   - Go to **SQL Editor** (left sidebar)
   - Click **New Query**
   - Copy and paste the contents of `supabase/migrations/001_create_tasks_table.sql`
   - Click **Run** (or press Cmd/Ctrl + Enter)

3. **Get your Supabase credentials**:
   - Go to **Settings** → **API** in your Supabase dashboard
   - Copy your **Project URL** (or just the project ID)
   - Copy your **anon/public** key

4. **Configure environment variables** (optional):
   - Create a `.env` file in the root directory:
   ```bash
   VITE_SUPABASE_PROJECT_ID=your-project-id
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
   - The app will use these if provided, otherwise falls back to defaults

**For detailed setup instructions, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**

### 4. Run the Development Server

```bash
npm run dev
```

The app will open at `http://localhost:3000`

### 5. Build for Production

```bash
npm run build
```

The production build will be in the `build/` directory.

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components (shadcn/ui)
│   ├── TaskBoard.tsx   # Main board component
│   ├── TaskCard.tsx    # Individual task card with inline editing
│   └── ...
├── constants/          # Application constants
│   └── taskStatus.ts   # Task status types and constants
├── config/             # Configuration
│   └── supabase.ts     # Supabase configuration (env vars)
├── services/            # Business logic and API calls
│   └── taskService.ts   # Task API service layer
├── hooks/              # Custom React hooks
│   ├── useTasks.ts     # Task state management
│   └── ...
├── types/              # TypeScript type definitions
│   └── Task.ts         # Task type definitions
└── supabase/           # Supabase Edge Functions
```

## Key Features Implementation

### Inline Editing
- Click any task title to edit it directly
- Press `Cmd+Enter` to save or `Esc` to cancel
- Changes are automatically saved to Supabase

### Recurring Tasks
- Tasks moved to "Done" are marked with a completion date
- After 7 days, tasks automatically move back to "Incoming"
- Recurrence is checked on app load and every minute

### Drag and Drop
- Drag tasks between any columns
- Visual feedback during drag operations
- State is persisted to Supabase

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production

### Code Style

- TypeScript for type safety
- Tailwind CSS for styling
- Functional components with hooks
- Minimal padding (`p-1`) on inputs/textareas for visual alignment

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Acknowledgments

- Inspired by the Hoop app interface
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
