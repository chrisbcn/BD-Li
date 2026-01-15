import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { FileText, Calendar, Clock, ChevronDown, ChevronRight, MessageSquare, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface BotSession {
    id: string;
    meeting_url: string;
    platform: string;
    status: 'provisioning' | 'connected' | 'completed' | 'failed' | 'disconnected';
    created_at: string;
    started_at: string;
    ended_at?: string;
}

interface TranscriptSegment {
    id: string;
    speaker: string;
    content: string;
    timestamp: string;
}

export function TranscriptHistory() {
    const [sessions, setSessions] = useState<BotSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedSession, setExpandedSession] = useState<string | null>(null);
    const [transcripts, setTranscripts] = useState<Record<string, TranscriptSegment[]>>({});
    const [loadingTranscripts, setLoadingTranscripts] = useState<string | null>(null);

    useEffect(() => {
        fetchSessions();

        // Subscribe to new sessions
        const subscription = supabase
            .channel('public:bot_sessions')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bot_sessions' }, () => {
                fetchSessions();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const fetchSessions = async () => {
        try {
            const { data, error } = await supabase
                .from('bot_sessions')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSessions(data || []);
        } catch (error) {
            console.error('Error fetching sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSession = async (sessionId: string) => {
        if (expandedSession === sessionId) {
            setExpandedSession(null);
            return;
        }

        setExpandedSession(sessionId);

        // Fetch transcripts if not already loaded
        if (!transcripts[sessionId]) {
            setLoadingTranscripts(sessionId);
            try {
                const { data, error } = await supabase
                    .from('bot_transcripts')
                    .select('*')
                    .eq('session_id', sessionId)
                    .order('created_at', { ascending: true });

                if (error) throw error;
                setTranscripts(prev => ({ ...prev, [sessionId]: data || [] }));
            } catch (error) {
                console.error('Error fetching transcripts:', error);
            } finally {
                setLoadingTranscripts(null);
            }
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'connected': return 'bg-green-500 hover:bg-green-600';
            case 'provisioning': return 'bg-yellow-500 hover:bg-yellow-600';
            case 'completed': return 'bg-blue-500 hover:bg-blue-600';
            case 'failed': return 'bg-red-500 hover:bg-red-600';
            default: return 'bg-gray-500 hover:bg-gray-600';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Meeting Transcripts
                    </CardTitle>
                    <CardDescription>
                        View history of all meetings attended by your AI agents.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {sessions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No meetings found. Dispatch an agent to get started.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {sessions.map((session) => (
                                <div key={session.id} className="border rounded-lg overflow-hidden">
                                    <div
                                        className="p-4 bg-card hover:bg-accent/50 transition-colors cursor-pointer flex items-center justify-between"
                                        onClick={() => toggleSession(session.id)}
                                    >
                                        <div className="flex items-center gap-4">
                                            {expandedSession === session.id ? (
                                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                            ) : (
                                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                            )}

                                            <div>
                                                <div className="font-medium truncate max-w-[300px] md:max-w-[500px]">
                                                    {session.meeting_url}
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {format(new Date(session.created_at), 'MMM d, yyyy')}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {format(new Date(session.created_at), 'h:mm a')}
                                                    </span>
                                                    <Badge variant="secondary" className="capitalize text-[10px] px-1.5 h-5">
                                                        {session.platform}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>

                                        <Badge className={`${getStatusColor(session.status)} border-0`}>
                                            {session.status}
                                        </Badge>
                                    </div>

                                    {expandedSession === session.id && (
                                        <div className="border-t bg-muted/30 p-4">
                                            {loadingTranscripts === session.id ? (
                                                <div className="flex justify-center py-4">
                                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                                </div>
                                            ) : transcripts[session.id]?.length === 0 ? (
                                                <div className="text-center py-4 text-muted-foreground italic">
                                                    No transcript data recorded for this session.
                                                </div>
                                            ) : (
                                                <ScrollArea className="h-[300px] pr-4">
                                                    <div className="space-y-4">
                                                        {transcripts[session.id]?.map((segment) => (
                                                            <div key={segment.id} className="flex gap-3 text-sm">
                                                                <div className="font-semibold min-w-[80px] text-right text-muted-foreground shrink-0">
                                                                    {segment.speaker || 'Unknown'}:
                                                                </div>
                                                                <div className="leading-relaxed">
                                                                    {segment.content}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </ScrollArea>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
