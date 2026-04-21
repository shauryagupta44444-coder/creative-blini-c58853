export default async (req) => {
  const N8N = "https://n8n-production-00d47.up.railway.app/webhook/kanha";
  
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 204, 
      headers: { 
        "Access-Control-Allow-Origin": "*", 
        "Access-Control-Allow-Methods": "POST, OPTIONS", 
        "Access-Control-Allow-Headers": "Content-Type" 
      }
    });
  }

  try {
    const body = await req.text();
    const r = await fetch(N8N, { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body 
    });
    const data = await r.text();
    return new Response(data, { 
      status: r.status, 
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch(e) {
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 502, 
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
};

export const config = { path: "/.netlify/functions/proxy" };
