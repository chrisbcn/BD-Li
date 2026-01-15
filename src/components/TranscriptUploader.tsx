/**
 * Transcript Uploader Component
 * Allows users to upload meeting transcripts for task extraction
 */

import { useState } from 'react';
import { Upload, FileText, AlertCircle, Check, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { processTranscript } from '../agents/meetAgent';
import { isValidTranscript, formatTranscriptSummary, parseTranscript } from '../services/meetService';

interface TranscriptUploaderProps {
  onSuccess?: () => void;
}

export function TranscriptUploader({ onSuccess }: TranscriptUploaderProps = {}) {
  const [meetingTitle, setMeetingTitle] = useState('');
  const [transcript, setTranscript] = useState('');
  const [participants, setParticipants] = useState('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [tasksCreated, setTasksCreated] = useState(0);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setTranscript(content);
      
      // Auto-extract participants if not provided
      if (!participants) {
        const parsed = parseTranscript(content);
        const participantNames = Array.from(parsed.speakers.keys())
          .filter(name => name !== 'Unknown')
          .join(', ');
        setParticipants(participantNames);
      }
    };
    reader.readAsText(file);
  };

  const handleProcess = async () => {
    // Validate inputs
    if (!meetingTitle.trim()) {
      setStatus('error');
      setMessage('Please enter a meeting title');
      return;
    }

    if (!transcript.trim()) {
      setStatus('error');
      setMessage('Please enter or upload a transcript');
      return;
    }

    if (!isValidTranscript(transcript)) {
      setStatus('error');
      setMessage('Transcript appears to be invalid or too short');
      return;
    }

    setStatus('processing');
    setMessage('Processing transcript with AI...');

    try {
      const participantList = participants
        ? participants.split(',').map(p => p.trim()).filter(p => p.length > 0)
        : undefined;

      const result = await processTranscript({
        meetingTitle,
        transcript,
        participants: participantList,
        meetingDate: new Date(),
      });

      setTasksCreated(result.tasksCreated);
      setStatus('success');
      setMessage(`Successfully created ${result.tasksCreated} tasks from the meeting!`);
      
      // Clear form and close modal after success
      setTimeout(() => {
        setMeetingTitle('');
        setTranscript('');
        setParticipants('');
        setStatus('idle');
        setMessage('');
        onSuccess?.();
      }, 2000);

    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to process transcript');
    }
  };

  const handlePreview = () => {
    if (!transcript) {
      setStatus('error');
      setMessage('Please enter a transcript first');
      return;
    }

    const parsed = parseTranscript(transcript);
    const summary = formatTranscriptSummary(parsed);
    
    alert(`Transcript Preview:\n\n${summary}`);
  };

  return (
    <div className="space-y-4">
        <div>
          <Label htmlFor="meeting-title">Meeting Title *</Label>
          <Input
            id="meeting-title"
            placeholder="e.g., Q4 Planning Meeting"
            value={meetingTitle}
            onChange={(e) => setMeetingTitle(e.target.value)}
            disabled={status === 'processing'}
          />
        </div>

        <div>
          <Label htmlFor="participants">Participants (comma-separated)</Label>
          <Input
            id="participants"
            placeholder="e.g., John Smith, Jane Doe, Alice Johnson"
            value={participants}
            onChange={(e) => setParticipants(e.target.value)}
            disabled={status === 'processing'}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Optional - will be auto-detected from transcript if not provided
          </p>
        </div>

        <div>
          <Label htmlFor="transcript">Transcript *</Label>
          <Textarea
            id="transcript"
            placeholder="Paste your meeting transcript here...&#10;&#10;Format:&#10;Speaker 1: This is what they said&#10;Speaker 2: And this is what they said&#10;&#10;Or just paste plain text meeting notes."
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            disabled={status === 'processing'}
            rows={12}
            className="font-mono text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Label
              htmlFor="file-upload"
              className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-md text-sm transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload Text File
            </Label>
            <Input
              id="file-upload"
              type="file"
              accept=".txt,.doc,.docx"
              onChange={handleFileUpload}
              disabled={status === 'processing'}
              className="hidden"
            />
          </div>
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={status === 'processing' || !transcript}
          >
            Preview
          </Button>
        </div>

        {status !== 'idle' && (
          <Alert variant={status === 'error' ? 'destructive' : 'default'}>
            {status === 'processing' && <AlertCircle className="h-4 w-4 animate-pulse" />}
            {status === 'success' && <Check className="h-4 w-4 text-green-500" />}
            {status === 'error' && <X className="h-4 w-4" />}
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleProcess}
          disabled={status === 'processing' || !meetingTitle || !transcript}
          className="w-full"
          size="lg"
        >
          {status === 'processing' ? (
            <>
              <AlertCircle className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              Extract Tasks from Transcript
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <strong>Supported formats:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Google Meet transcripts (exported from Google Docs)</li>
            <li>Formatted transcripts (Speaker: Statement)</li>
            <li>Plain meeting notes or summaries</li>
          </ul>
        </div>
    </div>
  );
}

