const N8N = "https://n8n-production-00d47.up.railway.app/webhook/kanha";
const GEMINI_KEY = process.env.GEMINI_API_KEY;

export default async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);

  // GET /models — fetch real Gemini model list
  if (req.method === "GET" && url.pathname.endsWith("/proxy") && url.searchParams.get("models") === "1") {
    if (!GEMINI_KEY) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY not set" }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_KEY}`);
      const data = await r.json();
      // Filter to text-generation capable models, exclude embeddings/vision-only/etc
      const models = (data.models || [])
        .filter(m =>
          m.supportedGenerationMethods?.includes("generateContent") &&
          !m.name.includes("embedding") &&
          !m.name.includes("aqa") &&
          !m.name.includes("image") &&
          !m.name.includes("tts") &&
          !m.name.includes("veo") &&
          !m.name.includes("lyria") &&
          !m.name.includes("live") &&
          !m.name.includes("vision") &&
          !m.name.includes("robotics") &&
          m.name.includes("gemini")
        )
        .map(m => ({
          id: m.name.replace("models/", ""),
          name: m.displayName || m.name.replace("models/", ""),
          description: m.description || ""
        }));
      return new Response(JSON.stringify({ models }), {
        status: 200, headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 502, headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
  }

  // POST — proxy chat to n8n
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }

  try {
    const body = await req.text();
    const r = await fetch(N8N, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const data = await r.text();
    return new Response(data, {
      status: r.status,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 502, headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
};

export const config = { path: "/.netlify/functions/proxy" };
