import { useState, useEffect } from 'react';
import { Activity } from '../types/Activity';
import { Contact } from '../types/Contact';
import { formatRelativeTime, formatDueDate } from '../utils/taskHelpers';
import { Mail, Phone, Video, Linkedin, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Badge } from './ui/badge';
import { cn } from './ui/utils';

interface ActivitiesTimelineProps {
  contactId?: string;
  taskId?: string;
  limit?: number;
}

export function ActivitiesTimeline({ contactId, taskId, limit }: ActivitiesTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadActivities = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { fetchActivitiesByContact, fetchActivitiesByTask, fetchAllActivities } = await import('../services/activityService');
        
        let fetchedActivities: Activity[] = [];
        if (contactId) {
          fetchedActivities = await fetchActivitiesByContact(contactId);
        } else if (taskId) {
          fetchedActivities = await fetchActivitiesByTask(taskId);
        } else {
          fetchedActivities = await fetchAllActivities(limit);
        }
        
        setActivities(fetchedActivities);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadActivities();
  }, [contactId, taskId, limit]);

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'call':
        return <Phone className="w-4 h-4" />;
      case 'meeting':
        return <Video className="w-4 h-4" />;
      case 'linkedin':
        return <Linkedin className="w-4 h-4" />;
      case 'note':
        return <FileText className="w-4 h-4" />;
      case 'task':
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getResponseBadge = (activity: Activity) => {
    if (!activity.is_outbound) return null;
    
    if (activity.response_received) {
      return (
        <Badge variant="outline" className="text-xs text-green-600 border-green-200">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Responded
          {activity.response_time_hours && (
            <span className="ml-1">({activity.response_time_hours}h)</span>
          )}
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="text-xs text-gray-500 border-gray-200">
          <Clock className="w-3 h-3 mr-1" />
          No response
        </Badge>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground text-sm">Loading activities...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-destructive text-sm">Error: {error}</div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <FileText className="w-12 h-12 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No activities yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Activity Timeline</h3>
      <div className="space-y-3">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
          >
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                {getActivityIcon(activity.type)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm capitalize">{activity.type}</span>
                    {activity.is_outbound !== undefined && (
                      <Badge variant="outline" className="text-xs">
                        {activity.is_outbound ? 'Outbound' : 'Inbound'}
                      </Badge>
                    )}
                    {activity.created_by_agent && (
                      <Badge variant="outline" className="text-xs text-blue-600">
                        {activity.agent_name || 'AI'}
                      </Badge>
                    )}
                  </div>
                  {activity.subject && (
                    <p className="text-sm font-medium text-foreground mb-1">{activity.subject}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(activity.date)}
                  </span>
                  {getResponseBadge(activity)}
                </div>
              </div>
              {activity.source_url && (
                <a
                  href={activity.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline mt-1 inline-block"
                >
                  View source →
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

