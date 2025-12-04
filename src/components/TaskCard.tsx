import { useState, useRef, useEffect } from 'react';
import { Task } from '../types/Task';
import { formatRelativeTime } from '../utils/taskHelpers';
import { Mail, Calendar, FileText, Circle, CheckCircle2, Video, Sparkles, ExternalLink, Check, X, Edit3 } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  onToggleComplete?: () => void;
  onAcceptAI?: () => void;
  onDismissAI?: () => void;
  onUpdate?: (id: string, updates: Partial<Task>) => void;
}

export function TaskCard({ task, onClick, onToggleComplete, onAcceptAI, onDismissAI, onUpdate }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update editing title when task changes
  useEffect(() => {
    if (!isEditing) {
      setEditingTitle(task.title);
    }
  }, [task.title, isEditing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUpdate) {
      setIsEditing(true);
      setEditingTitle(task.title);
    } else {
      onClick();
    }
  };

  const handleSave = () => {
    if (editingTitle.trim() && editingTitle !== task.title && onUpdate) {
      onUpdate(task.id, { title: editingTitle.trim() });
    } else {
      setEditingTitle(task.title);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditingTitle(task.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleBlur = () => {
    handleSave();
  };
  const getSourceIcon = () => {
    switch (task.source) {
      case 'gmail':
        return <Mail className="w-3 h-3" />;
      case 'calendar':
        return <Calendar className="w-3 h-3" />;
      case 'meet':
        return <Video className="w-3 h-3" />;
      case 'gemini':
        return <Sparkles className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getSourceLabel = () => {
    switch (task.source || 'manual') {
      case 'gmail':
        return 'Gmail';
      case 'calendar':
        return 'Calendar';
      case 'meet':
        return 'Meet';
      case 'gemini':
        return 'Gemini';
      default:
        return 'Manual';
    }
  };

  const getPriorityColor = () => {
    switch (task.priority || 'medium') {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const isCompleted = task.status === 'done';
  const isAICaptured = task.status === 'ai_captured';

  // AI Captured Task Card
  if (isAICaptured) {
    const sourceEmail = task.contact?.email || 'unknown sender';
    
    return (
      <div
        className="group bg-card border border-border rounded-lg p-4 mb-2 hover:border-primary/30 transition-colors"
      >
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {getSourceIcon()}
            <h4 className="truncate cursor-pointer" onClick={onClick}>
              {task.title}
            </h4>
          </div>
          <button className="text-muted-foreground hover:text-foreground shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="12" cy="12" r="1" fill="currentColor"/>
              <circle cx="12" cy="5" r="1" fill="currentColor"/>
              <circle cx="12" cy="19" r="1" fill="currentColor"/>
            </svg>
          </button>
        </div>

        <div className="border-t border-border my-3"></div>

        {/* Source info */}
        <div className="text-xs text-muted-foreground mb-2">
          Source: {getSourceLabel()} {sourceEmail !== 'unknown sender' && `from ${sourceEmail}`}
        </div>

        {/* Client and Deal */}
        {(task.client || task.deal_id) && (
          <div className="text-xs text-muted-foreground mb-2">
            {task.client && <span>Client: {task.client}</span>}
            {task.client && task.deal_id && <span> | </span>}
            {task.deal_id && <span>Deal: {task.deal_id.replace(/_/g, ' ')}</span>}
          </div>
        )}

        {/* Due date and Priority */}
        <div className="text-xs mb-2 flex items-center gap-2">
          {task.due_date && (
            <span className="text-muted-foreground">
              Due: {new Date(task.due_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          )}
          {task.due_date && task.priority && <span className="text-muted-foreground">|</span>}
          {task.priority && (
            <span className={getPriorityColor()}>
              Priority: {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </span>
          )}
        </div>

        {/* Context snippet */}
        {task.source_reference?.snippet && (
          <div className="text-xs text-muted-foreground mb-3 italic bg-muted/30 p-2 rounded">
            Context: "{task.source_reference.snippet}"
          </div>
        )}

        {/* Confidence */}
        <div className="text-xs text-muted-foreground mb-3">
          Confidence: {task.confidence_score || 0}%
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mb-3">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onAcceptAI?.();
            }}
          >
            <Check className="w-3.5 h-3.5 mr-1.5" />
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onDismissAI?.();
            }}
          >
            <X className="w-3.5 h-3.5 mr-1.5" />
            Dismiss
          </Button>
        </div>

        {/* View Links */}
        <div className="flex items-center gap-3 text-xs">
          {task.source_reference?.original_url && (
            <a
              href={task.source_reference.original_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              View Original {getSourceLabel()}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <button
            className="text-primary hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            View Context
          </button>
        </div>
      </div>
    );
  }

  // Regular Task Card
  return (
    <div
      onClick={(e) => {
        // Don't open sidebar if we're editing or if user clicked on the title area
        if (!isEditing && !(e.target as HTMLElement).closest('input')) {
          onClick();
        }
      }}
      className="group bg-card border border-border rounded-lg p-4 mb-2 hover:border-muted-foreground/30 transition-colors cursor-pointer"
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete?.();
          }}
          className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-primary" />
          ) : (
            <Circle className="w-5 h-5" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <Input
              ref={inputRef}
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className={`mb-1 h-auto text-base font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h4 
              className={`mb-1 ${isCompleted ? 'line-through text-muted-foreground' : ''} ${onUpdate ? 'cursor-text' : ''}`}
              onClick={handleTitleClick}
            >
              {task.title}
            </h4>
          )}
          
          {task.description && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Metadata row */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            {task.source && task.source !== 'manual' && (
              <div className="flex items-center gap-1">
                {getSourceIcon()}
                <span>{getSourceLabel()}</span>
              </div>
            )}
            {task.priority && task.priority !== 'medium' && (
              <>
                {task.source && task.source !== 'manual' && <span>•</span>}
                <span className={getPriorityColor()}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>
              </>
            )}
            {task.due_date && (
              <>
                {(task.source && task.source !== 'manual') || (task.priority && task.priority !== 'medium') ? <span>•</span> : null}
                <span>
                  {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </>
            )}
          </div>

          {/* Contact badge */}
          {task.contact && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-2 py-1 bg-muted/50 rounded text-xs">
                <div className="w-4 h-4 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-[10px]">
                    {task.contact.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </span>
                </div>
                <span>{task.contact.name}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
