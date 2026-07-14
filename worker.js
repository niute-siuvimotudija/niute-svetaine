const RESEND_URL = "https://api.resend.com/emails";
const OWNER = "info@niute.lt";
const FROM = "NIUTE <info@niute.lt>";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/api/order") return env.ASSETS.fetch(request);
    if (request.method !== "POST") return response({error:"Method not allowed"},405);
    if (!env.RESEND_API_KEY) return response({error:"Cloudflare trūksta RESEND_API_KEY."},500);
    try {
      const form = await request.formData();
      if (form.get("botcheck")) return response({success:true});
      const data = Object.fromEntries(form.entries());
      const customerEmail = clean(data["Kliento el. paštas"]);
      const customerName = clean(data["Kliento vardas"] || "Kliente");
      const orderNumber = clean(data["Užsakymo numeris"] || makeOrderNumber());
      if (!customerEmail || !customerEmail.includes("@")) return response({error:"Neteisingas el. pašto adresas."},400);

      const rows = Object.entries(data)
        .filter(([k,v]) => k !== "botcheck" && k !== "subject" && k !== "from_name" && String(v).trim())
        .map(([k,v]) => [k, String(v)]);

      const ownerHtml = layout(`Naujas užsakymas ${orderNumber}`,
        `<p>Gautas naujas užsakymas iš niute.lt.</p>${table(rows)}`);
      const customerHtml = layout(`Jūsų užsakymas gautas`,
        `<p>Sveiki, ${esc(customerName)}!</p>
         <p>Ačiū, kad pasirinkote <strong>NIUTE</strong>. Jūsų užsakymas sėkmingai gautas.</p>
         <p>Užsakymo numeris: <strong>${esc(orderNumber)}</strong></p>
         <p>Netrukus susisieksime ir suderinsime visas detales.</p>`);

      const [a,b] = await Promise.all([
        send(env.RESEND_API_KEY,{from:FROM,to:[OWNER],reply_to:customerEmail,subject:`Naujas NIUTE užsakymas – ${orderNumber}`,html:ownerHtml}),
        send(env.RESEND_API_KEY,{from:FROM,to:[customerEmail],reply_to:OWNER,subject:`Jūsų NIUTE užsakymas ${orderNumber} gautas`,html:customerHtml})
      ]);
      if (!a.ok || !b.ok) {
        console.log('Resend owner:',await a.text(),'customer:',await b.text());
        return response({error:"Nepavyko išsiųsti patvirtinimo laiško."},502);
      }
      return response({success:true,orderNumber});
    } catch(e) {
      console.log(e);
      return response({error:"Nepavyko apdoroti užsakymo."},500);
    }
  }
};

function send(key,body){return fetch(RESEND_URL,{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify(body)});}
function response(body,status=200){return new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}});}
function clean(v){return typeof v==='string'?v.trim().slice(0,5000):'';}
function makeOrderNumber(){const d=new Date();return `NI-${String(d.getUTCFullYear()).slice(-2)}${String(d.getUTCMonth()+1).padStart(2,'0')}${String(d.getUTCDate()).padStart(2,'0')}-${Math.floor(1000+Math.random()*9000)}`;}
function esc(v){return String(v||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');}
function table(rows){return `<table style="width:100%;border-collapse:collapse">${rows.map(([k,v])=>`<tr><td style="padding:9px;border-bottom:1px solid #e8ded4;font-weight:700;vertical-align:top">${esc(k)}</td><td style="padding:9px;border-bottom:1px solid #e8ded4;white-space:pre-wrap">${/^https?:\/\//.test(v)?`<a href="${esc(v)}">${esc(v)}</a>`:esc(v)}</td></tr>`).join('')}</table>`;}
function layout(title,content){return `<!doctype html><html><body style="margin:0;background:#f5f0ea;font-family:Arial,sans-serif;color:#302720"><div style="max-width:620px;margin:0 auto;padding:30px 16px"><div style="background:#2b241f;color:#fff;padding:25px;text-align:center"><div style="font-family:Georgia,serif;font-size:32px;letter-spacing:6px">NIUTE</div><div style="margin-top:7px;font-size:11px;letter-spacing:2px">SIUVIMO STUDIJA</div></div><div style="background:#fff;padding:28px"><h1 style="font-family:Georgia,serif;font-size:25px;font-weight:normal">${esc(title)}</h1>${content}<p style="margin-top:30px">Pagarbiai,<br><strong>NIUTE</strong><br><a href="https://niute.lt">niute.lt</a><br><a href="mailto:${OWNER}">${OWNER}</a></p></div></div></body></html>`;}
