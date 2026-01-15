/**
 * AgentDispatch Component
 * Allows users to "Dispatch" a headless bot to a meeting
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertCircle, Bot, Video, Terminal, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

export function AgentDispatch() {
    const [meetingUrl, setMeetingUrl] = useState('');
    const [platform, setPlatform] = useState<'zoom' | 'teams' | 'google_meet'>('zoom');
    const [status, setStatus] = useState<'idle' | 'dispatching' | 'active' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [activeSession, setActiveSession] = useState<any>(null);
    const [transcriptLog, setTranscriptLog] = useState<string[]>([]);

    // Real-time subscription to active session
    useEffect(() => {
        if (!activeSession?.id) return;

        const channel = supabase
            .channel('bot-monitoring')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'bot_sessions', filter: `id=eq.${activeSession.id}` },
                (payload) => {
                    setActiveSession(payload.new);
                    if (payload.new.status === 'connected') {
                        setMessage('Agent Connected to Meeting');
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'bot_transcripts', filter: `session_id=eq.${activeSession.id}` },
                (payload) => {
                    const newEntry = `[${payload.new.speaker || 'Unknown'}]: ${payload.new.content}`;
                    setTranscriptLog((prev) => [...prev, newEntry]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeSession?.id]);

    const handleDispatch = async () => {
        if (!meetingUrl) {
            setMessage('Please enter a meeting URL');
            setStatus('error');
            return;
        }

        setStatus('dispatching');
        setMessage('Provisioning Comedia Agent...');
        setTranscriptLog([]);

        try {
            const { data, error } = await supabase.functions.invoke('dispatch-bot', {
                body: { meetingUrl, platform },
            });

            if (error) throw error;
            if (!data.success) throw new Error(data.error || 'Failed to dispatch bot');

            setStatus('active');
            setMessage(`Agent Dispatched (ID: ${data.botId}) - Waiting for connection...`);
            setActiveSession({ id: data.sessionId, status: 'provisioning' });

        } catch (error) {
            console.error('Dispatch error:', error);
            setStatus('error');
            setMessage(error instanceof Error ? error.message : 'Failed to dispatch agent');
        }
    };

    const isLive = activeSession?.status === 'connected' || status === 'active';

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[600px]">
            {/* Control Panel */}
            <Card className="lg:col-span-5 flex flex-col h-full border-border/50 shadow-sm">
                <CardHeader className="pb-4 space-y-1">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Bot className="w-5 h-5 text-indigo-500" />
                        Mission Control
                    </CardTitle>
                    <CardDescription>Dispatch a headless agent to join your meeting</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 flex-1 flex flex-col">
                    <div className="space-y-3">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Platform</Label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'zoom', icon: Video, label: 'Zoom' },
                                { id: 'google_meet', icon: Video, label: 'Meet' },
                                { id: 'teams', icon: Video, label: 'Teams' }
                            ].map((p) => (
                                <div
                                    key={p.id}
                                    className={`
                    cursor-pointer border rounded-lg p-3 flex flex-col items-center justify-center gap-2 transition-all duration-200
                    ${platform === p.id
                                            ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-500 ring-1 ring-indigo-500/20'
                                            : 'hover:bg-accent/50 hover:border-accent-foreground/20 text-muted-foreground'}
                  `}
                                    onClick={() => setPlatform(p.id as any)}
                                >
                                    <p.icon className="w-5 h-5" />
                                    <span className="text-xs font-medium">{p.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="url" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Meeting URL</Label>
                        <div className="relative">
                            <Input
                                id="url"
                                placeholder={`Paste ${platform === 'zoom' ? 'Zoom' : platform === 'teams' ? 'Teams' : 'Meet'} link...`}
                                value={meetingUrl}
                                onChange={(e) => setMeetingUrl(e.target.value)}
                                disabled={status === 'dispatching' || status === 'active'}
                                className="h-10 text-sm bg-background border-input focus-visible:ring-indigo-500/30"
                            />
                        </div>
                    </div>

                    <div className="flex-1" />

                    {message && (
                        <Alert variant={status === 'error' ? 'destructive' : 'default'} className={`text-xs py-2 ${status === 'active' ? 'border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400' : ''}`}>
                            <AlertCircle className="h-3 w-3" />
                            <AlertDescription className="ml-2 font-medium">{message}</AlertDescription>
                        </Alert>
                    )}

                    <Button
                        className="w-full h-11 text-sm font-medium shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
                        size="lg"
                        onClick={handleDispatch}
                        disabled={!meetingUrl || status === 'dispatching' || status === 'active'}
                    >
                        {status === 'active' ? (
                            <span className="flex items-center gap-2"><div className="w-2 h-2 bg-white rounded-full animate-pulse" /> Agent Live</span>
                        ) : status === 'dispatching' ? (
                            <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" /> Deploying...</span>
                        ) : (
                            'Dispatch Agent'
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Terminal / Live Feed */}
            <Card className="lg:col-span-7 bg-slate-950 text-slate-100 border-slate-800 shadow-2xl overflow-hidden flex flex-col h-full">
                <CardHeader className="bg-slate-900/50 border-b border-slate-800 py-3 px-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-emerald-500" />
                            <CardTitle className="text-sm font-mono text-slate-300">Live Feed</CardTitle>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800">
                                <div className={`w-1.5 h-1.5 rounded-full ${activeSession?.status === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
                                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Link</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800">
                                <div className={`w-1.5 h-1.5 rounded-full ${transcriptLog.length > 0 ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-slate-600'}`} />
                                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Data</span>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0 flex-1 relative bg-slate-950 font-mono text-xs overflow-hidden">
                    <div className="absolute inset-0 overflow-y-auto p-4 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                        {transcriptLog.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                                <div className="w-12 h-12 rounded-full border border-slate-800 flex items-center justify-center">
                                    <div className="w-1 h-1 bg-slate-600 rounded-full animate-ping" />
                                </div>
                                <p>System Idle - Waiting for dispatch...</p>
                            </div>
                        ) : (
                            transcriptLog.map((log, i) => (
                                <div key={i} className="group flex gap-3 hover:bg-slate-900/50 -mx-4 px-4 py-0.5 transition-colors">
                                    <span className="text-slate-600 shrink-0 opacity-50 select-none w-16 text-right">
                                        {new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                    <div className="text-slate-300 break-words">
                                        {log.startsWith('[') ? (
                                            <>
                                                <span className="text-emerald-400 font-bold">{log.split(']:')[0]}]</span>
                                                <span className="text-slate-300">{log.split(']:')[1]}</span>
                                            </>
                                        ) : log}
                                    </div>
                                </div>
                            ))
                        )}
                        <div id="log-end" className="h-4" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
