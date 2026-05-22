/**
 * Cloudflare Pages Function: /api/subscribe
 *
 * Receives subscriber form POST, runs OFAC check via SanctionsLookup,
 * then either blocks the request or passes through to your email provider.
 *
 * Environment variables to set in Cloudflare Pages dashboard:
 *   SANCTIONS_LOOKUP_API_KEY  — from https://sanctionslookup.com/register (free)
 *   OFAC_MIN_SCORE            — match threshold 0–100, recommend 85 (optional, default 85)
 */

const SANCTIONS_API = "https://api.sanctionslookup.com/v1/screen";

export async function onRequestPost(context) {
  const { request, env } = context;

  // ── 1. Parse form body ──────────────────────────────────────────────────
  let body;
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    body = await request.json();
  } else {
    // Support HTML form submissions (application/x-www-form-urlencoded)
    const formData = await request.formData();
    body = Object.fromEntries(formData.entries());
  }

  const { firstName, lastName, email } = body;

  if (!firstName || !lastName || !email) {
    return jsonResponse({ error: "firstName, lastName, and email are required." }, 400);
  }

  // ── 2. OFAC check ───────────────────────────────────────────────────────
  const apiKey = env.SANCTIONS_LOOKUP_API_KEY;
  if (!apiKey) {
    console.error("SANCTIONS_LOOKUP_API_KEY not set");
    // Fail open with a warning — never silently block without a reason
    return jsonResponse({ error: "Compliance service unavailable. Please try again later." }, 503);
  }

  const minScore = parseInt(env.OFAC_MIN_SCORE || "85", 10);
  const fullName = `${firstName} ${lastName}`;

  let ofacResult;
  try {
    const ofacRes = await fetch(SANCTIONS_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subjects: [
          {
            subject_ref: email, // echoed back in response for tracing
            type: "INDIVIDUAL",
            name: fullName,
          },
        ],
        options: {
          min_score: minScore,
          max_results_per_subject: 3,
        },
      }),
    });

    if (!ofacRes.ok) {
      const errText = await ofacRes.text();
      console.error("SanctionsLookup error:", ofacRes.status, errText);
      // Fail open — log the error but don't block the subscriber
      return await proceedWithSubscription(body, env, { ofacSkipped: true });
    }

    ofacResult = await ofacRes.json();
  } catch (err) {
    console.error("SanctionsLookup fetch failed:", err.message);
    // Network error — fail open, log it
    return await proceedWithSubscription(body, env, { ofacSkipped: true });
  }

  // ── 3. Evaluate result ──────────────────────────────────────────────────
  const subjectResult = ofacResult?.results?.[0];
  const matches = subjectResult?.matches ?? [];
  const topMatch = matches[0];

  if (topMatch && topMatch.score >= minScore) {
    // POTENTIAL MATCH — log for compliance review, block subscription
    console.warn("OFAC potential match", {
      name: fullName,
      email,
      score: topMatch.score,
      matchedName: topMatch.matched_subject?.primary_name,
      lists: topMatch.sanctions?.map((s) => s.list),
    });

    // In production: alert your compliance team here (email, Slack webhook, etc.)
    await notifyComplianceTeam(env, { fullName, email, topMatch });

    return jsonResponse(
      {
        error: "We were unable to process your subscription at this time.",
        code: "COMPLIANCE_REVIEW",
      },
      403
    );
  }

  // ── 4. All clear — proceed ──────────────────────────────────────────────
  return await proceedWithSubscription(body, env, { ofacSkipped: false });
}

// ── Helpers ─────────────────────────────────────────────────────────────────

async function proceedWithSubscription(body, env, meta) {
  /**
   * TODO: Replace this stub with your actual email provider integration.
   *
   * Examples:
   *   - Mailchimp:    POST to /3.0/lists/{listId}/members
   *   - ConvertKit:   POST to /v3/forms/{formId}/subscribe
   *   - Resend:       POST to /emails
   *   - Custom DB:    Insert into your D1 / KV / external DB
   */

  // For now, just return success so you can test end-to-end
  console.log("Subscriber cleared OFAC check:", body.email, meta);

  return jsonResponse({
    success: true,
    message: "Thank you for subscribing!",
    // Remove `meta` from response in production if you don't want to expose it
    _meta: meta,
  });
}

async function notifyComplianceTeam(env, { fullName, email, topMatch }) {
  /**
   * TODO: Wire up your alert channel.
   *
   * Option A — Slack webhook:
   *   await fetch(env.SLACK_WEBHOOK_URL, {
   *     method: "POST",
   *     body: JSON.stringify({ text: `⚠️ OFAC hit: ${fullName} (${email}), score ${topMatch.score}` }),
   *   });
   *
   * Option B — Email via Resend/Sendgrid:
   *   await sendEmail(env, { to: "compliance@geopueblo.com", subject: "OFAC Review Required", ... })
   */
  console.warn("TODO: notify compliance team", { fullName, email, score: topMatch.score });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "https://geopueblo.com",
    },
  });
}
