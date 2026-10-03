/**
 * Soulcraft, newsletter signup (AWS Lambda + Function URL)
 * ------------------------------------------------------------------
 * Keeps your Sender.net API token OFF the website. The token lives only as a
 * Lambda environment variable; the browser only ever talks to this function.
 *
 * CORS NOTE: CORS is handled entirely by the Function URL's CORS config (AWS).
 * This code must NOT also set Access-Control-* headers, or the response ends up
 * with DUPLICATE headers and browsers reject it. So: no CORS headers here.
 *
 * ENV VARS:
 *   SENDER_TOKEN     (required), your Sender API token
 *   SENDER_GROUP_AI  (optional), second group for source=ai-learning (drives the guide automation)
 *   SENDER_GROUP_ID  (optional), Sender group id; defaults to 'b8zpn3'
 *                                 ("Wellmate Podcast")
 *   NOTIFY_TOPIC_ARN (optional), SNS topic ARN to email you on each signup.
 *                                 If unset, no notification is sent (signup
 *                                 still works). Needs sns:Publish on the role.
 *
 * TODO: an email already in Sender is reported as success but is NOT added to
 * SENDER_GROUP_ID, Sender rejects the create call outright. Anyone who signed
 * up before a group change therefore stays in their old group. Fixing this needs
 * Sender's "add subscriber to a group" endpoint (exact path/body unconfirmed).
 */

const SENDER_GROUP_ID = process.env.SENDER_GROUP_ID || 'b8zpn3';

exports.handler = async (event) => {
  const method =
    event?.requestContext?.http?.method || // Function URL / API GW v2
    event?.httpMethod ||                    // API GW v1
    'POST';

  if (method === 'OPTIONS') return { statusCode: 204, body: '' };
  if (method !== 'POST') return json(405, { ok: false, error: 'method_not_allowed' });

  // Decode the body (Function URLs base64-encode non-text content types).
  let raw = event?.body || '';
  if (event?.isBase64Encoded) raw = Buffer.from(raw, 'base64').toString('utf8');

  // Accept JSON or form-encoded.
  let email = '';
  let source = 'join';
  try {
    const ct = (headerVal(event, 'content-type') || '').toLowerCase();
    if (ct.includes('application/json')) {
      var parsed = JSON.parse(raw);
      email = ((parsed.email) || '').toString().trim();
      source = ((parsed.source) || 'join').toString().slice(0, 40);
    } else {
      email = (new URLSearchParams(raw).get('email') || '').toString().trim();
    }
  } catch (_) { /* fall through to validation */ }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json(400, { ok: false, error: 'invalid_email' });
  }

  const body = {
    email,
    trigger_automation: true,
    groups: (source === 'ai-learning' && process.env.SENDER_GROUP_AI) ? [SENDER_GROUP_ID, process.env.SENDER_GROUP_AI] : [SENDER_GROUP_ID],
  };

  let r;
  try {
    r = await fetch('https://api.sender.net/v2/subscribers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDER_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (_) {
    return json(502, { ok: false, error: 'upstream_unreachable' });
  }

  if (r.ok) {
    await notify(email, source);
    return json(200, { ok: true });
  }

  const text = await r.text().catch(() => '');

  // Log the real Sender response, without this, every failure below is
  // indistinguishable in CloudWatch and the cause has to be guessed at.
  console.error('sender_error', { status: r.status, body: text.slice(0, 500) });

  // Treat "already subscribed" as a friendly success (no notification on dupes).
  // NOTE: `already: true` is reported back so a test signup can tell a genuine
  // new subscription from a no-op. Sender does NOT add an existing subscriber to
  // the group on this path, see TODO at the top of this file.
  if (r.status === 409 || /exist|already/i.test(text)) {
    return json(200, { ok: true, already: true });
  }

  // Distinct codes so a bad token isn't mistaken for a bad group id.
  const error =
    r.status === 401 || r.status === 403 ? 'sender_auth' :
    /group/i.test(text)                  ? 'sender_group' :
                                           'sender_error';
  return json(502, { ok: false, error });
};

// Optional signup notification via SNS → emails whoever is subscribed to the
// topic (e.g. contact@wellmate.me). Never fails the signup if it errors.
async function notify(email, source) {
  const TopicArn = process.env.NOTIFY_TOPIC_ARN;
  if (!TopicArn) return;
  try {
    const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
    const sns = new SNSClient({});
    await sns.send(new PublishCommand({
      TopicArn,
      Subject: 'New Soulcraft subscriber',
      Message: `New signup on soulcraft.me (${source}):\n\n${email}\n\nAdded to group: ${SENDER_GROUP_ID}`,
    }));
  } catch (_) { /* notification is best-effort */ }
}

function headerVal(event, name) {
  const h = event?.headers || {};
  return h[name] || h[name.toLowerCase()] || h[name.toUpperCase()];
}

function json(statusCode, obj) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) };
}
