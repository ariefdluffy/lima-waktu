const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 100" width="180" height="36">
  <path d="M40 28 C29 28 22 36 22 44 L22 47 L58 47 L58 44 C58 36 51 28 40 28 Z" fill="none" stroke="#C8A84B" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
  <line x1="40" y1="28" x2="40" y2="21" stroke="#C8A84B" stroke-width="3" stroke-linecap="round"/>
  <path d="M37 18 A4.5 4.5 0 1 1 44.5 15 A3 3 0 1 0 37 18 Z" fill="#C8A84B"/>
  <rect x="18" y="47" width="44" height="34" fill="none" stroke="#C8A84B" stroke-width="3" stroke-linejoin="round"/>
  <path d="M32 81 L32 66 Q40 59 48 66 L48 81" fill="none" stroke="#C8A84B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="10" y="52" width="8" height="29" fill="none" stroke="#C8A84B" stroke-width="2.5"/>
  <path d="M10 52 Q14 46 18 52" fill="none" stroke="#C8A84B" stroke-width="2.5" stroke-linecap="round"/>
  <rect x="62" y="52" width="8" height="29" fill="none" stroke="#C8A84B" stroke-width="2.5"/>
  <path d="M62 52 Q66 46 70 52" fill="none" stroke="#C8A84B" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="6" y1="81" x2="74" y2="81" stroke="#C8A84B" stroke-width="3" stroke-linecap="round"/>
  <circle cx="22" cy="90" r="3" fill="#C8A84B"/>
  <circle cx="33" cy="90" r="3" fill="#C8A84B"/>
  <circle cx="40" cy="90" r="3" fill="#C8A84B"/>
  <circle cx="47" cy="90" r="3" fill="#C8A84B"/>
  <circle cx="58" cy="90" r="3" fill="#C8A84B"/>
  <line x1="88" y1="20" x2="88" y2="80" stroke="#C8A84B" stroke-width="1" opacity="0.3"/>
  <text x="102" y="52" font-family="'Georgia','Times New Roman',serif" font-size="32" font-weight="700" fill="#0A3D2E" letter-spacing="1">Lima<tspan fill="#C8A84B">Waktu</tspan></text>
  <text x="104" y="70" font-family="'Georgia','Times New Roman',serif" font-size="11" fill="#555" letter-spacing="3">JADWAL SHALAT &amp; PENGINGAT</text>
</svg>`;

export interface WelcomeTemplateProps {
  fullName: string;
  loginUrl: string;
}

export function renderWelcomeHtml(props: WelcomeTemplateProps): string {
  return `<!DOCTYPE html>
<html lang="id">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4">
    <tr><td align="center" style="padding:40px 16px">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <tr><td style="text-align:center;padding:40px 40px 24px">${LOGO_SVG}</td></tr>
        <tr><td style="padding:0 40px 8px;text-align:center">
          <h1 style="margin:0 0 8px;font-size:22px;color:#0A3D2E;font-weight:700">Selamat Datang, ${props.fullName}!</h1>
          <p style="margin:0;font-size:15px;color:#555;line-height:1.6">Terima kasih telah mendaftar di <strong>Lima Waktu</strong>. Akun Anda sudah siap digunakan.</p>
        </td></tr>
        <tr><td style="padding:24px 40px;text-align:center">
          <a href="${props.loginUrl}" style="display:inline-block;padding:12px 32px;background:#0A3D2E;color:#fff;text-decoration:none;font-size:15px;font-weight:600;border-radius:6px">Masuk ke Dashboard</a>
        </td></tr>
        <tr><td style="padding:0 40px 32px;text-align:center">
          <p style="margin:0;font-size:13px;color:#888;line-height:1.5">Atau buka link berikut:<br><a href="${props.loginUrl}" style="color:#C8A84B;font-size:13px">${props.loginUrl}</a></p>
        </td></tr>
        <tr><td style="border-top:1px solid #eee;padding:24px 40px;text-align:center">
          <p style="margin:0;font-size:12px;color:#aaa">Hormat kami,<br><strong style="color:#0A3D2E">Tim Lima Waktu</strong></p>
        </td></tr>
      </table>
    </td></tr></table>
</body></html>`;
}
