import { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Textarea } from './ui/textarea';

interface AddNewTaskProps {
  onAdd: (title: string, description: string) => Promise<void> | void;
  externalTrigger?: boolean;
  onExternalTriggerComplete?: () => void;
}

export function AddNewTask({ onAdd, externalTrigger, onExternalTriggerComplete }: AddNewTaskProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (externalTrigger) {
      setIsAdding(true);
      onExternalTriggerComplete?.();
    }
  }, [externalTrigger, onExternalTriggerComplete]);

  useEffect(() => {
    if (isAdding && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isAdding]);

  const handleSave = async () => {
    if (title.trim()) {
      await onAdd(title.trim(), description.trim());
      setTitle('');
      setDescription('');
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setTitle('');
      setDescription('');
      setIsAdding(false);
    }
  };

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Add new
      </button>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <Textarea
        ref={textareaRef}
        placeholder="Task title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        className="mb-2 border-none p-0 resize-none min-h-[40px]"
        rows={1}
      />
      <Textarea
        placeholder="Add description... (⌘↵ to save)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onKeyDown={handleKeyDown}
        className="border-none p-0 text-sm text-muted-foreground resize-none min-h-[60px]"
        rows={2}
      />
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleSave}
          className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition-colors"
        >
          Save
        </button>
        <button
          onClick={() => {
            setTitle('');
            setDescription('');
            setIsAdding(false);
          }}
          className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
