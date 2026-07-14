NIUTE 5.2 FINAL – Cloudflare Pages Functions + Resend

KAS PAKEISTA
- Pašalintas viešas Web3Forms access_key.
- Užsakymo forma dabar siunčia duomenis į /api/order.
- Cloudinary nuotraukų įkėlimas paliktas.
- Tu gauni užsakymą į info@niute.lt.
- Klientas gauna automatinį patvirtinimo laišką su užsakymo numeriu.

KAIP ĮKELTI Į GITHUB
Į repozitorijos pagrindą įkelk:
- index.html
- style.css
- script.js
- README.txt
- visą functions aplanką (functions/api/order.js)

SVARBU: GitHub turi matytis būtent toks kelias:
functions/api/order.js

CLOUDFLARE NUSTATYMAS
Kai Cloudflare sėkmingai aptiks Functions:
1. Workers & Pages → niute-svetaine → Settings.
2. Variables and secrets → Add.
3. Name: RESEND_API_KEY
4. Type: Secret
5. Value: naujas Resend API raktas.
6. Save ir paleisk naują deployment.

SAUGUMAS
Anksčiau pokalbyje parodytą Resend API raktą būtina Revoke/Delete.
Naudok tik naują raktą ir jo niekam nesiųsk.

PATIKRINIMAS
Atidaryk niute.lt, pateik bandomąjį užsakymą ir patikrink:
- info@niute.lt gauna užsakymą;
- kliento el. paštas gauna patvirtinimą.
