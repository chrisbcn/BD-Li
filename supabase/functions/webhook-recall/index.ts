/**
 * Supabase Edge Function: webhook-recall
 * 
 * Receives events from Recall.ai (transcripts, status updates).
 * Docs: https://docs.recall.ai/docs/webhooks
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
    try {
        const event = await req.json();
        console.log(`[Webhook] Received event: ${event.type}`, event.data?.bot_id);

        // 1. Handle Bot Status Changes
        if (event.type === 'bot.status_change') {
            const { status, bot_id } = event.data;

            // Recall: 'ready', 'joining_call', 'in_call', 'call_ended', 'fatal_error'
            let dbStatus = 'provisioning';
            if (status.code === 'in_call') dbStatus = 'connected';
            if (status.code === 'call_ended') dbStatus = 'completed';
            if (status.code === 'fatal_error') dbStatus = 'failed';

            await supabase
                .from('bot_sessions')
                .update({
                    status: dbStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('recall_bot_id', bot_id);

            // Trigger AI Task Extraction on Call End
            if (status.code === 'call_ended') {
                console.log(`[Webhook] Call ended for bot ${bot_id}. Triggering extraction.`);

                // 1. Fetch full transcript
                const { data: transcripts } = await supabase
                    .from('bot_transcripts')
                    .select('content, speaker')
                    .eq('session_id', (
                        await supabase
                            .from('bot_sessions')
                            .select('id')
                            .eq('recall_bot_id', bot_id)
                            .single()
                    ).data?.id)
                    .order('created_at', { ascending: true });

                const fullText = transcripts?.map(t => `[${t.speaker}]: ${t.content}`).join('\n') || '';

                if (fullText) {
                    console.log('[Webhook] Sending transcript to extract-tasks...');
                    await fetch(`${supabaseUrl}/functions/v1/extract-tasks`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${supabaseKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            content: fullText,
                            source: {
                                type: 'bot_recall',
                                metadata: { bot_id }
                            }
                        })
                    });
                }
            }
        }

        // 2. Handle Transcript (Real-time)
        if (event.type === 'bot.transcription') {
            const { bot_id, transcript } = event.data;
            const text = transcript.original_transcript;
            const speaker = transcript.speaker;

            if (text) {
                // Find session
                const { data: sessions } = await supabase
                    .from('bot_sessions')
                    .select('id')
                    .eq('recall_bot_id', bot_id)
                    .limit(1);

                if (sessions && sessions.length > 0) {
                    const sessionId = sessions[0].id;

                    // Log transcript
                    await supabase
                        .from('bot_transcripts')
                        .insert({
                            session_id: sessionId,
                            content: text,
                            speaker: speaker,
                            timestamp: new Date().toISOString(),
                            is_processed: false
                        });
                }
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('[Webhook] Error:', error);
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
});
