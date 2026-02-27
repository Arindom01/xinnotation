/**
 * Cloudflare Pages Function — Lead Submission Handler
 *
 * Handles POST /api/submit-lead
 * - Validates incoming form data
 * - Stores lead in Cloudflare KV
 * - Sends notification email (via SendGrid/Resend placeholder)
 * - Returns JSON response
 *
 * Setup:
 *   1. Create a KV namespace: wrangler kv:namespace create LEADS_KV
 *   2. Bind it in wrangler.toml or Cloudflare Pages settings
 *   3. Set SENDGRID_API_KEY as a secret: wrangler secret put SENDGRID_API_KEY
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const contentType = request.headers.get('Content-Type') || '';
    if (!contentType.includes('application/json')) {
      return jsonResponse(
        { success: false, error: 'Content-Type must be application/json' },
        400
      );
    }

    const body = await request.json();

    const validation = validateLead(body);
    if (!validation.valid) {
      return jsonResponse(
        { success: false, errors: validation.errors },
        422
      );
    }

    const lead = sanitizeLead(body);
    const leadId = `lead_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

    lead.id = leadId;
    lead.ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    lead.country = request.headers.get('CF-IPCountry') || 'unknown';
    lead.userAgent = request.headers.get('User-Agent') || 'unknown';
    lead.receivedAt = new Date().toISOString();

    if (env.LEADS_KV) {
      await env.LEADS_KV.put(leadId, JSON.stringify(lead), {
        expirationTtl: 60 * 60 * 24 * 365,
        metadata: {
          email: lead.email,
          company: lead.company,
          createdAt: lead.receivedAt,
        },
      });
    }

    if (env.SENDGRID_API_KEY) {
      await sendNotificationEmail(env, lead);
    }

    return jsonResponse({
      success: true,
      message: 'Thank you! We will be in touch within 24 hours.',
      leadId,
    });
  } catch (err) {
    console.error('Lead submission error:', err);
    return jsonResponse(
      { success: false, error: 'Internal server error. Please try again.' },
      500
    );
  }
}

function validateLead(data) {
  const errors = [];

  if (!data.fullName || data.fullName.trim().length < 2) {
    errors.push({ field: 'fullName', message: 'Full name is required (min 2 characters)' });
  }

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push({ field: 'email', message: 'A valid business email is required' });
  }

  if (!data.company || data.company.trim().length < 2) {
    errors.push({ field: 'company', message: 'Company name is required (min 2 characters)' });
  }

  if (!data.consent) {
    errors.push({ field: 'consent', message: 'Consent is required to proceed' });
  }

  const validIndustries = [
    '', 'Technology', 'Healthcare', 'Finance', 'Retail',
    'Manufacturing', 'Energy', 'Education', 'Government', 'Other',
  ];
  if (data.industry && !validIndustries.includes(data.industry)) {
    errors.push({ field: 'industry', message: 'Invalid industry selection' });
  }

  return { valid: errors.length === 0, errors };
}

function sanitizeLead(data) {
  const clean = (str) =>
    typeof str === 'string' ? str.trim().slice(0, 500) : '';

  return {
    fullName: clean(data.fullName),
    email: clean(data.email).toLowerCase(),
    company: clean(data.company),
    phone: clean(data.phone),
    industry: clean(data.industry),
    service: clean(data.service),
    budget: clean(data.budget),
    timeline: clean(data.timeline),
    message: clean(data.message).slice(0, 2000),
    consent: Boolean(data.consent),
    submittedAt: data.submittedAt || new Date().toISOString(),
  };
}

async function sendNotificationEmail(env, lead) {
  const emailBody = {
    personalizations: [
      {
        to: [{ email: env.NOTIFICATION_EMAIL || 'hello@x-innotation.com' }],
        subject: `New Lead: ${lead.fullName} from ${lead.company}`,
      },
    ],
    from: { email: 'noreply@x-innotation.com', name: 'X-Innotation Website' },
    content: [
      {
        type: 'text/html',
        value: `
          <h2>New Lead Submission</h2>
          <table style="border-collapse:collapse;width:100%;max-width:600px">
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Name</td><td style="padding:8px;border:1px solid #ddd">${lead.fullName}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Email</td><td style="padding:8px;border:1px solid #ddd">${lead.email}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Company</td><td style="padding:8px;border:1px solid #ddd">${lead.company}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Phone</td><td style="padding:8px;border:1px solid #ddd">${lead.phone || 'N/A'}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Industry</td><td style="padding:8px;border:1px solid #ddd">${lead.industry || 'N/A'}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Service</td><td style="padding:8px;border:1px solid #ddd">${lead.service || 'N/A'}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Budget</td><td style="padding:8px;border:1px solid #ddd">${lead.budget || 'N/A'}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Timeline</td><td style="padding:8px;border:1px solid #ddd">${lead.timeline || 'N/A'}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Message</td><td style="padding:8px;border:1px solid #ddd">${lead.message || 'N/A'}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Country</td><td style="padding:8px;border:1px solid #ddd">${lead.country}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Received</td><td style="padding:8px;border:1px solid #ddd">${lead.receivedAt}</td></tr>
          </table>
        `,
      },
    ],
  };

  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailBody),
    });

    if (!res.ok) {
      console.error('SendGrid error:', res.status, await res.text());
    }
  } catch (err) {
    console.error('Email send failed:', err);
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}
