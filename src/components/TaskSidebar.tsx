import { useState, useEffect } from 'react';
import { Task, TaskPriority } from '../types/Task';
import { formatRelativeTime, formatDueDate } from '../utils/taskHelpers';
import { X, Mail, Calendar, Clock, Tag, User, Building, DollarSign, Edit2, Check, Trash2, Video, Sparkles, ExternalLink, AlertCircle, Repeat } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';

interface TaskSidebarProps {
  task: Task;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function TaskSidebar({ task, onUpdate, onDelete, onClose }: TaskSidebarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [priority, setPriority] = useState<TaskPriority>(task.priority || 'medium');
  const [client, setClient] = useState(task.client || '');
  const [dealId, setDealId] = useState(task.deal_id || '');
  const [labelsInput, setLabelsInput] = useState(task.labels?.join(', ') || '');
  const [category, setCategory] = useState(task.tags?.[0] || '');
  const [leadName, setLeadName] = useState(task.contact?.name || '');
  const [recurrenceEnabled, setRecurrenceEnabled] = useState(task.recurrence_enabled ?? true);
  const [recurrenceDays, setRecurrenceDays] = useState(task.recurrence_days ?? 7);

  // Handle ESC key to close sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSave = () => {
    const updates: Partial<Task> = {
      title,
      description,
      priority,
      client: client.trim() || undefined,
      deal_id: dealId.trim() || undefined,
      labels: labelsInput.split(',').map(l => l.trim()).filter(l => l),
      recurrence_enabled: recurrenceEnabled,
      recurrence_days: recurrenceDays,
    };
    
    // Update tags with category
    if (category.trim()) {
      updates.tags = [category.trim()];
    } else {
      updates.tags = [];
    }
    
    // Update contact with lead name
    if (leadName.trim()) {
      updates.contact = {
        ...task.contact,
        name: leadName.trim(),
      };
    } else {
      updates.contact = undefined;
    }
    
    onUpdate(task.id, updates);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
      onClose();
    }
  };

  const getSourceIcon = () => {
    switch (task.source) {
      case 'gmail':
        return <Mail className="w-4 h-4" />;
      case 'calendar':
        return <Calendar className="w-4 h-4" />;
      case 'meet':
        return <Video className="w-4 h-4" />;
      case 'gemini':
        return <Sparkles className="w-4 h-4" />;
      default:
        return <Tag className="w-4 h-4" />;
    }
  };

  const getSourceLabel = () => {
    switch (task.source || 'manual') {
      case 'gmail':
        return 'Gmail';
      case 'calendar':
        return 'Google Calendar';
      case 'meet':
        return 'Google Meet';
      case 'gemini':
        return 'Gemini AI';
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

  const initials = task.contact?.name
    ? task.contact.name.split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
    : '?';

  const isAICaptured = task.status === 'ai_captured';

  return (
    <>
      {/* Overlay backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Sidebar */}
      <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-background border-l border-border overflow-y-auto z-50 shadow-2xl">
        <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
        <Tabs defaultValue="details" className="flex-1">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-6">
        {/* AI Captured Banner */}
        {isAICaptured && (
          <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm">AI Captured Task</span>
            </div>
            <div className="text-xs text-muted-foreground mb-3">
              This task was automatically captured from {getSourceLabel()} with {task.confidence_score || 0}% confidence
            </div>
            {task.source_reference?.original_url && (
              <a
                href={task.source_reference.original_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                View Original Source
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* Task Title & Description */}
        <div className="mb-6">
          {isEditing ? (
            <>
              <div className="mb-4">
                <label className="text-sm text-muted-foreground mb-2 block">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task title"
                  autoFocus
                  className="px-4 py-3"
                />
              </div>
              <div className="mb-4">
                <label className="text-sm text-muted-foreground mb-2 block">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description..."
                  rows={4}
                  className="px-4 py-3"
                />
              </div>
              <div className="mb-4">
                <label className="text-sm text-muted-foreground mb-2 block">Priority</label>
                <Select value={priority} onValueChange={(value) => setPriority(value as TaskPriority)}>
                  <SelectTrigger className="px-4 py-3 h-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="mb-4">
                <label className="text-sm text-muted-foreground mb-2 block">Client</label>
                <Input
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="Client or company name"
                  className="px-4 py-3"
                />
              </div>
              <div className="mb-4">
                <label className="text-sm text-muted-foreground mb-2 block">Deal ID</label>
                <Input
                  value={dealId}
                  onChange={(e) => setDealId(e.target.value)}
                  placeholder="Associated deal identifier"
                  className="px-4 py-3"
                />
              </div>
              <div className="mb-4">
                <label className="text-sm text-muted-foreground mb-2 block">Labels</label>
                <Input
                  value={labelsInput}
                  onChange={(e) => setLabelsInput(e.target.value)}
                  placeholder="Comma-separated labels (e.g., urgent, finance, q4)"
                  className="px-4 py-3"
                />
              </div>
              <div className="mb-4">
                <label className="text-sm text-muted-foreground mb-2 block">Category</label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., high-priority, renewal"
                  className="px-4 py-3"
                />
              </div>
              <div className="mb-4">
                <label className="text-sm text-muted-foreground mb-2 block">Lead/Person</label>
                <Input
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="Name of contact or lead"
                  className="px-4 py-3"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave}>
                  <Check className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setTitle(task.title);
                    setDescription(task.description);
                    setPriority(task.priority || 'medium');
                    setClient(task.client || '');
                    setDealId(task.deal_id || '');
                    setLabelsInput(task.labels?.join(', ') || '');
                    setCategory(task.tags?.[0] || '');
                    setLeadName(task.contact?.name || '');
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4 mb-3">
                <h2 className="flex-1">{task.title}</h2>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
              {task.description && (
                <p className="text-muted-foreground mb-3">{task.description}</p>
              )}
            </>
          )}
        </div>

        {/* Priority, Source, Due Date */}
        <div className="mb-6 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Priority:</span>
            <span className={getPriorityColor()}>
              {(task.priority || 'medium').charAt(0).toUpperCase() + (task.priority || 'medium').slice(1)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Source:</span>
            <div className="flex items-center gap-2">
              {getSourceIcon()}
              <span>{getSourceLabel()}</span>
            </div>
          </div>
          {task.due_date && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Due Date:</span>
              <span>{formatDueDate(task.due_date)}</span>
            </div>
          )}
        </div>

        {/* Client and Deal Info */}
        {(task.client || task.deal_id) && (
          <>
            <Separator className="my-6" />
            <div className="mb-6 space-y-2 text-sm">
              <h3 className="text-sm mb-3">Business Context</h3>
              {task.client && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Client:</span>
                  <span>{task.client}</span>
                </div>
              )}
              {task.deal_id && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Deal:</span>
                  <span className="text-xs">{task.deal_id}</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* Source Context */}
        {task.source_reference?.snippet && (
          <>
            <Separator className="my-6" />
            <div className="mb-6">
              <h3 className="text-sm mb-3">Source Context</h3>
              <div className="p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground italic">
                "{task.source_reference.snippet}"
              </div>
              {task.source_reference.email_id && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Email ID: {task.source_reference.email_id}
                </div>
              )}
              {task.source_reference.meeting_id && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Meeting ID: {task.source_reference.meeting_id}
                </div>
              )}
            </div>
          </>
        )}

        {/* Labels */}
        {task.labels && Array.isArray(task.labels) && task.labels.length > 0 && (
          <>
            <Separator className="my-6" />
            <div className="mb-6">
              <h3 className="text-sm mb-3">Labels</h3>
              <div className="flex flex-wrap gap-2">
                {task.labels.map((label, idx) => (
                  <Badge key={idx} variant="outline">
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        <Separator className="my-6" />

        {/* Contact Information */}
        {task.contact && (
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={task.contact.avatar} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-sm">{task.contact.name}</h3>
                {task.contact.role && task.contact.company && (
                  <p className="text-xs text-muted-foreground">
                    {task.contact.role} | {task.contact.company}
                  </p>
                )}
                {task.contact.email && (
                  <p className="text-xs text-muted-foreground">
                    {task.contact.email}
                  </p>
                )}
              </div>
              {task.contact.last_contact && (
                <div className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Last contact: {formatRelativeTime(task.contact.last_contact)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Account Information */}
        {task.account_info && (
          <div className="mb-6">
            <h3 className="text-sm mb-3">Account Information</h3>
            <div className="space-y-2 text-sm">
              {task.account_info.contract_value && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contract Value:</span>
                  <span>{task.account_info.contract_value}</span>
                </div>
              )}
              {task.account_info.contract_expiry && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contract Expiry:</span>
                  <span>{formatDueDate(task.account_info.contract_expiry)}</span>
                </div>
              )}
              {task.account_info.relationship_duration && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Relationship:</span>
                  <span>{task.account_info.relationship_duration}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Next Actions */}
        {task.next_actions && task.next_actions.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm mb-3">Next Actions</h3>
            <ul className="space-y-2 text-sm">
              {task.next_actions.map((action, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recent Activity */}
        {task.recent_activity && task.recent_activity.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm mb-3">Recent Activity</h3>
            <ul className="space-y-3 text-sm">
              {task.recent_activity.map((activity, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-muted-foreground">•</span>
                  <div className="flex-1">
                    <span className="text-muted-foreground">
                      {formatDueDate(activity.date)}:
                    </span>{' '}
                    {activity.description}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {task.tags.map((tag, idx) => (
                <Badge key={idx} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Separator className="my-6" />

        {/* Metadata */}
        <div className="space-y-2 text-xs text-muted-foreground">
          <div>Created {formatRelativeTime(task.created_at)}</div>
          <div>Updated {formatRelativeTime(task.updated_at)}</div>
        </div>

        {/* Delete Button */}
        <div className="mt-8">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            className="w-full"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Task
          </Button>
        </div>
      </div>
    </div>
    </>
  );
}
