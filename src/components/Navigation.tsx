import { LayoutDashboard, Users, CheckSquare, BarChart3, Bot, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from './ui/utils';

type NavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'contacts', label: 'Contacts', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'ai-agents', label: 'AI Agents', icon: Bot },
  { id: 'transcripts', label: 'Transcripts', icon: FileText },
];

interface NavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function Navigation({ activeSection, onSectionChange }: NavigationProps) {
  return (
    <nav className="flex items-center gap-2 border-b border-border pb-4 mb-6">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeSection === item.id;
        return (
          <Button
            key={item.id}
            variant={isActive ? 'default' : 'ghost'}
            onClick={() => onSectionChange(item.id)}
            className={cn(
              'flex items-center gap-2',
              isActive && 'bg-primary text-primary-foreground'
            )}
          >
            <Icon className="w-4 h-4" />
            {item.label}
          </Button>
        );
      })}
    </nav>
  );
}

