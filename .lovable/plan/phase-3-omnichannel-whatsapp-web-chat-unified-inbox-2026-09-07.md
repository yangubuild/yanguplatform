# Phase 3 — Omnichannel (WhatsApp + Web Chat + Unified Inbox)

Most of this phase already landed in the previous session. This plan covers only the gaps that remain, so nothing is rebuilt and no credits go to repeat audits.

## Already built and live (no work needed)

- One agent, many channels: a channels record per agent for voice / WhatsApp / web chat, with truthful status (setup required / connected / error / disabled). No duplicate agents.
- Shared brain: one retrieval + memory + reply engine used by voice, WhatsApp and web chat. Knowledge, instructions and customer memory are shared, not copied per channel.
- Canonical customers: WhatsApp numbers and web visitors resolve into the same customer identity, memory and timeline created in Phase 2.
- WhatsApp: inbound webhook (signature-verified), outbound send, provider message IDs and delivery states, connect/disconnect with credentials stored server-side only.
- Web chat: embeddable widget script, opaque expiring sessions, allowed-domain checks, rate limits, no secrets in the browser.
- Unified inbox: channel filters, human takeover and return-to-AI, replies routed through the secure send function.
- Backend functions deployed; the app type-checks clean.

## Remaining work in this plan

1. Channels panel inside the Agent Command Center
   - Today channel setup lives on the Integrations page only. Add the same Channels section to the agent's own Configure view, with Voice / WhatsApp / Web Chat cards and real status, plus SMS, Email and Messenger shown as Coming Soon (non-clickable).
   - Voice card links to the existing Vapi/number settings; no voice logic changes.

2. Web chat configuration completeness
   - Add the missing fields to the web chat settings: launcher position, agent display name, avatar, and offline/handoff message. Widget script reads them from the session bootstrap.

3. Customer 360 timeline channel labels
   - Timeline entries display as CALL / WHATSAPP / WEB CHAT / LEAD / APPOINTMENT / MEMORY / TAKEOVER, referencing existing records — no duplicated messages.

4. Analytics by channel
   - Add conversations, messages, AI-vs-human, leads and appointments broken down by channel, computed from real rows, with empty states when there is no data. No new tables.

5. Audit entries for channel actions
   - Log WhatsApp connect/disconnect, web chat enable/disable, channel config changes, takeover and return-to-AI into the existing audit log. Never log credentials.

6. Verification pass (single, focused)
   - Load the agents pages in a browser: channels panel, integrations, inbox with the channel filters, a customer profile.
   - Exercise the web chat endpoint end to end against a test agent (create session, send a message, receive an AI reply, confirm it appears in the inbox and on the customer timeline).
   - Confirm the service-worker/offline behaviour for normal navigation, refresh and direct route loads. Real airplane-mode testing on a device stays yours to do; I will not claim it.
   - Vapi webhook security stays untouched; a real phone call remains your manual test.

## What I will need from you (WhatsApp stays Setup Required until then)

WhatsApp is code-complete but cannot go live without your own Meta account values. When you're ready I'll ask for them one at a time and tell you exactly where each comes from:

1. A Meta Business account with WhatsApp Business Platform (Cloud API).
2. Phone number ID and WhatsApp Business account ID.
3. A permanent access token.
4. An app secret (for verifying incoming messages).
5. A verify token you choose.
6. The webhook URL to paste into Meta — I'll give you the exact URL.

Nothing invented, nothing faked: until those exist the WhatsApp card honestly reads "Setup Required".

## Out of scope

SMS, Email, Messenger, Instagram, Salesforce, HubSpot, Zapier/Make/n8n, workflow engine, SIP/PBX/enterprise routing. No compliance certification claims. No Phase 4 work.

## Technical notes

- No new tables. Existing `agent_channels`, `agent_channel_secrets`, `agent_webchat_sessions`, `agent_conversations`, `agent_messages`, `agent_customer_*`, `agent_audit_logs` cover everything above.
- Frontend edits: agent command center channels panel, web chat settings form, customer timeline renderer, analytics page, plus small additions to the existing channel hooks.
- Backend edits limited to returning the extra web chat display settings in the widget bootstrap and writing audit rows; no changes to auth, RLS, signature verification or rate limiting.
