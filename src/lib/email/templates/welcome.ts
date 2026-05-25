export interface WelcomeTemplateProps {
  fullName: string;
  loginUrl: string;
  logoUrl: string;
}

export function renderWelcomeHtml(props: WelcomeTemplateProps): string {
  return `<!DOCTYPE html>
<html lang="id">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Segoe UI','Helvetica Neue',Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4">
    <tr><td align="center" style="padding:40px 16px">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <tr><td style="text-align:center;padding:40px 40px 24px"><img src="${props.logoUrl}" alt="Lima Waktu" width="180" style="display:block;margin:0 auto;max-width:180px;height:auto"></td></tr>
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
