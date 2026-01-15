/**
 * Supabase Edge Function: dispatch-bot
 * 
 * Spawns a Recall.ai bot to join a meeting.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { meetingUrl, platform } = await req.json();
        const recallApiKey = Deno.env.get('RECALL_API_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

        if (!recallApiKey) {
            throw new Error('RECALL_API_KEY not configured');
        }

        if (!meetingUrl) {
            throw new Error('meetingUrl is required');
        }

        // 1. Create Bot in Recall.ai
        const webhookUrl = `${supabaseUrl}/functions/v1/webhook-recall`;
        console.log(`[Dispatch] Spawning bot for ${platform}: ${meetingUrl}`);
        console.log(`[Dispatch] Webhook URL: ${webhookUrl}`);

        const recallResponse = await fetch('https://us-west-2.recall.ai/api/v1/bot', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${recallApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                meeting_url: meetingUrl,
                bot_name: 'Comedia Task Agent',
                webhook_url: webhookUrl
            }),
        });

        if (!recallResponse.ok) {
            const errorText = await recallResponse.text();
            throw new Error(`Recall.ai API Error: ${recallResponse.status} - ${errorText}`);
        }

        const botData = await recallResponse.json();
        console.log('[Dispatch] Bot created:', botData);

        // 2. Store session in Database
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get user from auth header
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Missing Authorization header');
        }

        const supabaseClientForAuth = createClient(
            supabaseUrl,
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error: userError } = await supabaseClientForAuth.auth.getUser();
        if (userError || !user) {
            console.error('[Dispatch] Auth error:', userError);
            throw new Error('Invalid user token');
        }

        const { data: session, error: dbError } = await supabase
            .from('bot_sessions')
            .insert({
                meeting_url: meetingUrl,
                platform: platform || 'generic',
                status: 'provisioning',
                recall_bot_id: botData.id,
                agent_name: 'Comedia Task Agent',
                metadata: { recall_data: botData },
                user_id: user.id
            })
            .select()
            .single();

        if (dbError) {
            console.error('[Dispatch] DB Error:', dbError);
            // Don't fail the request if bot launched, but log it
        }

        return new Response(
            JSON.stringify({
                success: true,
                botId: botData.id,
                sessionId: session?.id
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('[Dispatch] Error:', error);
        // Return 200 even on error so client can parse the message
        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
