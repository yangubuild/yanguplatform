import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { WelcomeEmail } from '../_shared/email-templates/welcome.tsx'

const SITE_NAME = 'yangu'
const SENDER_DOMAIN = 'notify.yangu.io'
const FROM_DOMAIN = 'yangu.io'
const DASHBOARD_URL = 'https://yangu.io/dashboard'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const apiKey = Deno.env.get('LOVABLE_API_KEY')

  if (!apiKey) {
    console.error('LOVABLE_API_KEY not configured')
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Authenticate the calling user
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: { user }, error: authError } = await userClient.auth.getUser()
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Use service role client for DB operations
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Check if welcome email was already sent
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, welcome_email_sent_at')
    .eq('id', user.id)
    .single()

  if (profile?.welcome_email_sent_at) {
    return new Response(
      JSON.stringify({ skipped: true, reason: 'already_sent' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Render the welcome email
  const templateProps = {
    displayName: profile?.display_name || undefined,
    dashboardUrl: DASHBOARD_URL,
  }

  const html = await renderAsync(React.createElement(WelcomeEmail, templateProps))
  const text = await renderAsync(React.createElement(WelcomeEmail, templateProps), {
    plainText: true,
  })

  // Enqueue to transactional_emails queue
  const messageId = crypto.randomUUID()
  const { error: enqueueError } = await supabase.rpc('enqueue_email', {
    queue_name: 'transactional_emails',
    payload: {
      message_id: messageId,
      to: user.email,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject: 'Welcome to yangu!',
      html,
      text,
      purpose: 'transactional',
      label: 'welcome',
      queued_at: new Date().toISOString(),
    },
  })

  if (enqueueError) {
    console.error('Failed to enqueue welcome email', { error: enqueueError, userId: user.id })
    return new Response(
      JSON.stringify({ error: 'Failed to queue email' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Log pending status
  await supabase.from('email_send_log').insert({
    message_id: messageId,
    template_name: 'welcome',
    recipient_email: user.email,
    status: 'pending',
  })

  // Mark welcome email as sent on profile
  await supabase
    .from('profiles')
    .update({ welcome_email_sent_at: new Date().toISOString() })
    .eq('id', user.id)

  console.log('Welcome email enqueued', { userId: user.id, messageId })

  return new Response(
    JSON.stringify({ success: true, message_id: messageId }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
