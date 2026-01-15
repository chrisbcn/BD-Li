import { useState, useEffect } from 'react';
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
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">AI Agents</h2>
        <p className="text-muted-foreground mt-2">
          Deploy autonomous agents to extract tasks from your communications.
        </p>
      </div>

      <Tabs defaultValue="meeting-bot" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="meeting-bot">Meeting Agent</TabsTrigger>
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

        <TabsContent value="manual-upload" className="mt-6 animate-in slide-in-from-bottom-4 duration-500">
          <TranscriptUploader />
        </TabsContent>
      </Tabs>
    </div>
  );
}
