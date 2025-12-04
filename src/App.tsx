import { TaskBoard } from './components/TaskBoard';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <div className="dark h-screen w-screen bg-background text-foreground overflow-hidden">
      <div className="h-full flex flex-col p-6">
        <header className="mb-6 shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary text-primary-foreground rounded-lg flex items-center justify-center">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
              </svg>
            </div>
            <h1>hoop</h1>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-muted-foreground text-sm">
              Simple task management that gets out of your way
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border">N</kbd>
                New task
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border">D</kbd>
                Toggle done
              </span>
            </div>
          </div>
        </header>

        <TaskBoard />
      </div>
      <Toaster />
    </div>
  );
}
