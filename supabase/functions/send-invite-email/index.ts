import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
const SITE_URL = Deno.env.get("SITE_URL") || "http://localhost:3000"
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

interface InvitePayload {
  email: string
  token: string
  orgName: string
  role: string
}

serve(async (req: Request) => {
  // CORS headers for browser requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    })
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    })
  }

  // Verify the caller is authenticated
  const authHeader = req.headers.get("Authorization")
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "Missing authorization header" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    )
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    )
  }

  if (!RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }

  const { email, token, orgName, role }: InvitePayload = await req.json()

  if (!email || !token) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: email, token" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }

  const inviteUrl = `${SITE_URL}/signup?invite=${encodeURIComponent(token)}`
  const roleLabel = role === "admin" ? "Manager" : "Viewer"
  const safeOrgName = escapeHtml(orgName)

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Edara <onboarding@resend.dev>",
      to: [email],
      subject: `You're invited to join ${safeOrgName} on Edara`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 0;">
          <h2 style="color: #111; margin-bottom: 16px;">You've been invited!</h2>
          <p style="color: #555; line-height: 1.6;">
            You've been invited to join <strong>${safeOrgName}</strong> as a <strong>${roleLabel}</strong> on Edara —
            a property management platform.
          </p>
          <p style="margin: 24px 0;">
            <a href="${inviteUrl}"
               style="background: #111; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
              Accept Invitation
            </a>
          </p>
          <p style="color: #888; font-size: 13px; line-height: 1.5;">
            This invitation expires in 7 days. If you didn't expect this email, you can safely ignore it.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #aaa; font-size: 12px;">
            Edara — Property Management Platform
          </p>
        </div>
      `,
    }),
  })

  if (!res.ok) {
    const errorBody = await res.text()
    return new Response(
      JSON.stringify({ error: "Failed to send email", details: errorBody }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }

  const data = await res.json()
  return new Response(JSON.stringify({ success: true, id: data.id }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
})
