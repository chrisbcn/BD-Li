import { useState, useEffect, useRef } from 'react';
import { Bot, Mail, MessageSquare, Linkedin, Video, RefreshCw, Check, X, AlertCircle, Settings, Upload } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { TranscriptUploader } from './TranscriptUploader';
import { AgentDispatch } from './AgentDispatch';
import { TranscriptHistory } from './TranscriptHistory';
import { isAIConfigured } from '../config/ai';
import { isGmailAuthenticated, getGmailAuthUrl } from '../services/gmailService';
import { scanGmailForTasks } from '../agents/emailAgent';
import { supabase } from '../lib/supabase';

// ... (Keep existing interfaces and initial state setup if needed, or simplify for the new view)

export function AIAgentsPanel() {
  const [gmailStatus, setGmailStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [gmailMessage, setGmailMessage] = useState<string>('');
  const [gmailAutoScan, setGmailAutoScan] = useState<boolean>(() => {
    const stored = localStorage.getItem('gmail_auto_scan_enabled');
    return stored ? stored === 'true' : true;
  });
  const autoScanRef = useRef(false);

  const runGmailScan = async (isAuto = false) => {
    if (autoScanRef.current) return;
    autoScanRef.current = true;
    setGmailStatus('scanning');
    setGmailMessage(isAuto ? 'Auto-scanning Gmail...' : 'Scanning Gmail...');
    try {
      const result = await scanGmailForTasks({ days: 7, maxResults: 20, unreadOnly: true });
      setGmailStatus('success');
      setGmailMessage(`Scanned ${result.messagesScanned} emails • Created ${result.tasksCreated} tasks`);
    } catch (error) {
      console.error('Gmail scan error:', error);
      setGmailStatus('error');
      setGmailMessage(error instanceof Error ? error.message : 'Gmail scan failed');
    } finally {
      autoScanRef.current = false;
    }
  };

  useEffect(() => {
    localStorage.setItem('gmail_auto_scan_enabled', gmailAutoScan ? 'true' : 'false');
  }, [gmailAutoScan]);

  useEffect(() => {
    if (!gmailAutoScan) return;
    const interval = setInterval(() => {
      runGmailScan(true);
    }, 10 * 60 * 1000);

    const initial = setTimeout(() => {
      runGmailScan(true);
    }, 4000);

    return () => {
      clearInterval(interval);
      clearTimeout(initial);
    };
  }, [gmailAutoScan]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">AI Agents</h2>
        <p className="text-muted-foreground mt-2">
          Deploy autonomous agents to extract tasks from your communications.
        </p>
      </div>

      <Tabs defaultValue="meeting-bot" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[520px]">
          <TabsTrigger value="meeting-bot">Meeting Agent</TabsTrigger>
          <TabsTrigger value="gmail-agent">Gmail Agent</TabsTrigger>
          <TabsTrigger value="manual-upload">Manual Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="meeting-bot" className="mt-6 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <AgentDispatch />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Extension Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium">Active</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Listening on Meet & Zoom Web</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Headless Cloud Bots</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-sm font-medium">Recall.ai Ready</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Can join Desktop App Meetings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground mt-1">Tasks extracted</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gmail-agent" className="mt-6 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Gmail Auto-Scan
              </CardTitle>
              <CardDescription>
                Automatically scan recent Gmail messages and create tasks in Incoming.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => runGmailScan(false)}
                  disabled={gmailStatus === 'scanning'}
                  className="gap-2"
                >
                  <RefreshCw className={gmailStatus === 'scanning' ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} />
                  Scan Gmail Now
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setGmailAutoScan((prev) => !prev)}
                >
                  Auto-scan: {gmailAutoScan ? 'On' : 'Off'}
                </Button>
              </div>

              {gmailMessage && (
                <Alert variant={gmailStatus === 'error' ? 'destructive' : 'default'}>
                  <AlertDescription>{gmailMessage}</AlertDescription>
                </Alert>
              )}

              <div className="text-xs text-muted-foreground">
                Auto-scan runs every 10 minutes while the app is open. Requires Gmail OAuth
                refresh token configured in Supabase Edge Function env.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual-upload" className="mt-6 animate-in slide-in-from-bottom-4 duration-500">
          <TranscriptUploader />
        </TabsContent>
      </Tabs>
    </div>
  );
}
