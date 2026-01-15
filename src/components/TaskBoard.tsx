import { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { useTasks } from '../hooks/useTasks';
import { useColumnNames } from '../hooks/useColumnNames';
import { TaskColumn } from './TaskColumn';
import { TaskCard } from './TaskCard';
import { TaskSidebar } from './TaskSidebar';
import { Task } from '../types/Task';
import { TaskStatus, VALID_TASK_STATUSES } from '../constants/taskStatus';
import { Button } from './ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export function TaskBoard() {
  const { tasks, addTask, updateTask, deleteTask, moveTask, getTasksByStatus, isLoading } = useTasks();
  const { columnNames, updateColumnName } = useColumnNames();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [triggerTodoAdd, setTriggerTodoAdd] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const taskId = active.id as string;
      const newStatus = over.id as TaskStatus;
      
      // Check if over.id is a valid status
      if (VALID_TASK_STATUSES.includes(newStatus)) {
        moveTask(taskId, newStatus);
      }
    }
    
    setActiveTask(null);
  };

  const handleAddTask = (status: TaskStatus) => async (title: string, description: string) => {
    await addTask(title, description, status);
  };

  const handleTaskClick = (task: Task) => {
    console.log('Task clicked:', task.title);
    setSelectedTask(task);
  };

  const handleToggleComplete = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      if (task.status === 'done') {
        moveTask(id, 'todo');
      } else {
        moveTask(id, 'done');
      }
    }
  };

  const handleAcceptAI = (id: string) => {
    moveTask(id, 'todo');
    toast.success('Task accepted and moved to To-do');
  };

  const handleDismissAI = (id: string) => {
    deleteTask(id);
    toast.success('Task dismissed');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input/textarea or sidebar is open
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || 
                      target.tagName === 'TEXTAREA' ||
                      target.isContentEditable;
      
      if (isTyping || selectedTask) return;

      // "n" key - add new task to To-do
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setTriggerTodoAdd(true);
      }
      
      // "d" key - toggle show/hide done tasks
      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        setShowDone(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTask]);

  const incomingTasks = getTasksByStatus('incoming');
  const todoTasks = getTasksByStatus('todo');
  const doneTasks = getTasksByStatus('done');

  // Get the current version of the selected task from the tasks array
  const currentSelectedTask = selectedTask 
    ? tasks.find(t => t.id === selectedTask.id) || selectedTask
    : null;
  
  console.log('Selected task:', selectedTask?.title || 'none', selectedTask);
  console.log('Current selected task:', currentSelectedTask?.title || 'none', currentSelectedTask);
  console.log('Should render sidebar:', !!currentSelectedTask);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      <div className="flex items-center justify-end mb-6 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDone(!showDone)}
        >
          {showDone ? (
            <>
              <EyeOff className="w-4 h-4 mr-2" />
              Hide Done
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-2" />
              Show Done
            </>
          )}
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className={`flex-1 grid gap-6 min-h-0 overflow-hidden ${showDone ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
          <TaskColumn
            title={columnNames.incoming}
            status="incoming"
            tasks={incomingTasks}
            onTaskClick={handleTaskClick}
            onToggleComplete={handleToggleComplete}
            onAdd={handleAddTask('incoming')}
            onTitleChange={(newTitle) => updateColumnName('incoming', newTitle)}
            count={incomingTasks.length}
            onUpdate={updateTask}
          />
          <TaskColumn
            title={columnNames.todo}
            status="todo"
            tasks={todoTasks}
            onTaskClick={handleTaskClick}
            onToggleComplete={handleToggleComplete}
            onAdd={handleAddTask('todo')}
            onTitleChange={(newTitle) => updateColumnName('todo', newTitle)}
            count={todoTasks.length}
            triggerAdd={triggerTodoAdd}
            onTriggerAddComplete={() => setTriggerTodoAdd(false)}
            onUpdate={updateTask}
          />
          {showDone && (
            <TaskColumn
              title={columnNames.done}
              status="done"
              tasks={doneTasks}
              onTaskClick={handleTaskClick}
              onToggleComplete={handleToggleComplete}
              onAdd={handleAddTask('done')}
              onTitleChange={(newTitle) => updateColumnName('done', newTitle)}
              count={doneTasks.length}
              onUpdate={updateTask}
            />
          )}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="rotate-3 scale-105">
              <TaskCard
                task={activeTask}
                onClick={() => {}}
                onToggleComplete={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {currentSelectedTask && (
        <TaskSidebar
          task={currentSelectedTask}
          onUpdate={updateTask}
          onDelete={deleteTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
