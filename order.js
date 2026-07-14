const RESEND_URL = "https://api.resend.com/emails";
const OWNER_EMAIL = "info@niute.lt";
const FROM_EMAIL = "NIUTE <info@niute.lt>";

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.RESEND_API_KEY) {
    return response({ success: false, message: "Cloudflare trūksta RESEND_API_KEY Secret." }, 500);
  }

  try {
    const data = await request.json();

    const orderNumber = clean(data["Užsakymo numeris"]) || makeOrderNumber();
    const customerName = clean(data["Kliento vardas"]) || "Kliente";
    const customerEmail = clean(data["Kliento el. paštas"]);
    const phone = clean(data["Telefono numeris"]);
    const service = clean(data["Paslauga"]);
    const garment = clean(data["Drabužio tipas"]);
    const urgency = clean(data["Skubumas"]);
    const preferredDate = clean(data["Pageidaujama grąžinimo data"]);
    const returnMethod = clean(data["Grąžinimo būdas"]);
    const description = clean(data["Taisymo aprašymas"]);
    const photoLinks = clean(data["Nuotraukų nuorodos"]);

    if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      return response({ success: false, message: "Įveskite galiojantį el. pašto adresą." }, 400);
    }

    const ownerRows = [
      ["Užsakymo numeris", orderNumber],
      ["Klientas", customerName],
      ["El. paštas", customerEmail],
      ["Telefonas", phone],
      ["Paslauga", service],
      ["Drabužio tipas", garment],
      ["Skubumas", urgency],
      ["Pageidaujama data", preferredDate],
      ["Grąžinimo būdas", returnMethod],
      ["Aprašymas", description],
      ["Nuotraukos", photoLinks]
    ].filter(([, value]) => value);

    const ownerMail = {
      from: FROM_EMAIL,
      to: [OWNER_EMAIL],
      reply_to: customerEmail,
      subject: `Naujas NIUTE užsakymas – ${orderNumber}`,
      html: layout(
        `Naujas užsakymas ${orderNumber}`,
        `<p>Gautas naujas užsakymas iš <strong>niute.lt</strong>.</p>${details(ownerRows)}`
      )
    };

    const customerMail = {
      from: FROM_EMAIL,
      to: [customerEmail],
      reply_to: OWNER_EMAIL,
      subject: `Jūsų NIUTE užsakymas ${orderNumber} gautas`,
      html: layout(
        "Jūsų užsakymas gautas",
        `<p>Sveiki, ${escapeHtml(customerName)}!</p>
         <p>Ačiū, kad pasirinkote <strong>NIUTE</strong>. Jūsų užsakymas sėkmingai gautas.</p>
         <div style="margin:24px 0;padding:18px;background:#f4eee7;border-left:4px solid #9a7657">
           Užsakymo numeris: <strong>${escapeHtml(orderNumber)}</strong>
         </div>
         <p>Netrukus susisieksime su Jumis ir suderinsime kainą bei siuntimo detales.</p>
         <p>Jeigu turite klausimų, atsakykite į šį laišką arba rašykite <a href="mailto:${OWNER_EMAIL}">${OWNER_EMAIL}</a>.</p>`
      )
    };

    const [ownerResult, customerResult] = await Promise.all([
      send(env.RESEND_API_KEY, ownerMail),
      send(env.RESEND_API_KEY, customerMail)
    ]);

    if (!ownerResult.ok || !customerResult.ok) {
      const ownerError = ownerResult.ok ? "" : await ownerResult.text();
      const customerError = customerResult.ok ? "" : await customerResult.text();
      console.error("Resend klaida", { ownerError, customerError });
      return response({ success: false, message: "Nepavyko išsiųsti patvirtinimo laiško. Bandykite dar kartą." }, 502);
    }

    return response({ success: true, orderNumber });
  } catch (error) {
    console.error(error);
    return response({ success: false, message: "Nepavyko apdoroti užsakymo." }, 500);
  }
}

export function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

function send(apiKey, body) {
  return fetch(RESEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

function response(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function clean(value) {
  return typeof value === "string" ? value.trim().slice(0, 6000) : "";
}

function makeOrderNumber() {
  const now = new Date();
  const stamp = [
    String(now.getUTCFullYear()).slice(-2),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    String(now.getUTCDate()).padStart(2, "0")
  ].join("");
  return `NI-${stamp}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function linkifyPhotos(value) {
  const urls = String(value || "").match(/https?:\/\/[^\s]+/g) || [];
  if (!urls.length) return escapeHtml(value);
  return urls.map((url, index) => `<a href="${escapeHtml(url)}">Atidaryti ${index + 1} nuotrauką</a>`).join("<br>");
}

function details(rows) {
  return `<table style="width:100%;border-collapse:collapse">${rows.map(([label, value]) => {
    const formatted = label === "Nuotraukos" ? linkifyPhotos(value) : escapeHtml(value);
    return `<tr>
      <td style="width:38%;padding:10px;border-bottom:1px solid #e7ddd3;font-weight:700;vertical-align:top">${escapeHtml(label)}</td>
      <td style="padding:10px;border-bottom:1px solid #e7ddd3;white-space:pre-line">${formatted}</td>
    </tr>`;
  }).join("")}</table>`;
}

function layout(title, content) {
  return `<!doctype html>
  <html lang="lt">
    <body style="margin:0;background:#f5f0ea;font-family:Arial,sans-serif;color:#302720">
      <div style="max-width:640px;margin:0 auto;padding:28px 14px">
        <div style="background:#2b241f;color:#fff;padding:26px;text-align:center">
          <div style="font-family:Georgia,serif;font-size:34px;letter-spacing:7px">NIUTE</div>
          <div style="margin-top:7px;font-size:11px;letter-spacing:2px">SIUVIMO STUDIJA</div>
        </div>
        <div style="background:#fff;padding:28px;line-height:1.6">
          <h1 style="margin-top:0;font-family:Georgia,serif;font-size:26px;font-weight:400">${escapeHtml(title)}</h1>
          ${content}
          <p style="margin-top:30px">Pagarbiai,<br><strong>NIUTE</strong><br>
            <a href="https://niute.lt">niute.lt</a><br>
            <a href="mailto:${OWNER_EMAIL}">${OWNER_EMAIL}</a>
          </p>
        </div>
      </div>
    </body>
  </html>`;
}
