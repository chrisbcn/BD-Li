import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../types/Task';
import { TaskCard } from './TaskCard';

interface SortableTaskCardProps {
  task: Task;
  onClick: () => void;
  onToggleComplete?: () => void;
  onAcceptAI?: () => void;
  onDismissAI?: () => void;
  onUpdate?: (id: string, updates: Partial<Task>) => void;
}

export function SortableTaskCard({ task, onClick, onToggleComplete, onAcceptAI, onDismissAI, onUpdate }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard
        task={task}
        onClick={onClick}
        onToggleComplete={onToggleComplete}
        onAcceptAI={onAcceptAI}
        onDismissAI={onDismissAI}
        onUpdate={onUpdate}
      />
    </div>
  );
}