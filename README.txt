NIUTE 5.1 – Cloudflare Worker + Resend

Ši versija siunčia užsakymą į info@niute.lt ir automatinį patvirtinimą klientui.

SVARBU: pokalbyje parodytas Resend API raktas turi būti panaikintas. Sukurkite naują raktą ir jo niekam nesiųskite.

Įkėlimas į GitHub:
1. Ištrinkite senus repozitorijos failus arba pakeiskite juos visais šio ZIP failais.
2. GitHub šaknyje turi būti worker.js, wrangler.jsonc, package.json ir aplankas public.
3. Cloudflare paleiskite naują deployment iš GitHub.
4. Po deployment projekto Settings skiltyje jau bus galima pridėti Secret:
   Name: RESEND_API_KEY
   Value: naujas Resend API raktas.
5. Išsaugokite ir paleiskite Deploy dar kartą.
6. Patikrinkite užsakymo formą adresu niute.lt.
