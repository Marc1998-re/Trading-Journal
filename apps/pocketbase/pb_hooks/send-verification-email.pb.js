/// <reference path="../pb_data/types.d.ts" />

const escapeHtml = (value) => {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const extractFirstUrl = (message) => {
  const html = message.html || "";
  const text = message.text || "";
  const hrefMatch = html.match(/href=["']([^"']+)["']/i);

  if (hrefMatch && hrefMatch[1]) {
    return hrefMatch[1].replace(/&amp;/g, "&");
  }

  const urlMatch = `${html} ${text}`.match(/https?:\/\/[^\s"'<>]+/i);
  return urlMatch ? urlMatch[0].replace(/&amp;/g, "&") : "";
};

const buildVerificationEmail = (verificationUrl, recipientAddress) => {
  const safeUrl = escapeHtml(verificationUrl);
  const safeRecipient = escapeHtml(recipientAddress);

  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>E-Mail bestaetigen</title>
</head>
<body style="margin:0;padding:0;background:#0b1113;color:#f8f6f0;font-family:Inter,Segoe UI,Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0b1113;min-height:100vh;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#11191c;border:1px solid rgba(255,255,255,0.12);border-radius:18px;overflow:hidden;box-shadow:0 28px 80px rgba(0,0,0,0.38);">
          <tr>
            <td style="height:5px;background:linear-gradient(90deg,#f4b84a,#18d5b0,#45b7ff);font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td align="center" style="padding:46px 34px 18px;">
              <div style="display:inline-block;padding:8px 13px;border:1px solid rgba(24,213,176,0.28);border-radius:999px;background:rgba(24,213,176,0.10);color:#18d5b0;font-size:11px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;">
                Marc's Trading Journal
              </div>
              <h1 style="margin:26px 0 0;color:#ffffff;font-size:36px;line-height:1.08;font-weight:900;letter-spacing:0;">
                Bestaetige deine E-Mail
              </h1>
              <p style="margin:18px auto 0;max-width:480px;color:#b6c2bf;font-size:17px;line-height:1.65;font-weight:500;">
                Willkommen im Trading Journal. Ein Klick genuegt und dein Account ist bereit fuer Trade-Erfassung, Performance-Metriken und visuelle Auswertungen.
              </p>
              ${safeRecipient ? `<p style="margin:18px 0 0;color:#7f908c;font-size:13px;line-height:1.5;">Account: <strong style="color:#f8f6f0;">${safeRecipient}</strong></p>` : ""}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:22px 34px 34px;">
              <a href="${safeUrl}" style="display:inline-block;background:#18d5b0;color:#071012;text-decoration:none;border-radius:10px;padding:17px 34px;font-size:16px;font-weight:900;letter-spacing:0.02em;box-shadow:0 18px 38px rgba(24,213,176,0.24);">
                E-Mail bestaetigen
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 34px 38px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.10);border-radius:14px;">
                <tr>
                  <td style="padding:22px 24px;text-align:center;">
                    <p style="margin:0;color:#b6c2bf;font-size:14px;line-height:1.65;">
                      Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:
                    </p>
                    <p style="margin:12px 0 0;color:#18d5b0;font-size:12px;line-height:1.6;word-break:break-all;">
                      <a href="${safeUrl}" style="color:#18d5b0;text-decoration:none;">${safeUrl}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="border-top:1px solid rgba(255,255,255,0.10);padding:24px 34px 30px;background:#0f1719;">
              <p style="margin:0;color:#7f908c;font-size:12px;line-height:1.7;">
                Wenn du dieses Konto nicht erstellt hast, kannst du diese E-Mail ignorieren.
              </p>
              <p style="margin:10px 0 0;color:#5f706c;font-size:11px;line-height:1.6;">
                Marc's Trading Journal &middot; Professional Trading Analytics
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const isVerificationMessage = (message) => {
  const content = `${message.subject || ""} ${message.html || ""} ${message.text || ""}`.toLowerCase();

  return (
    content.includes("verify") ||
    content.includes("verification") ||
    content.includes("confirm-verification")
  ) && !content.includes("password reset");
};

onMailerSend((e) => {
  try {
    if (isVerificationMessage(e.message)) {
      const verificationUrl = extractFirstUrl(e.message);
      const recipientAddress = e.message.to && e.message.to.length > 0 ? e.message.to[0].address : "";

      if (verificationUrl) {
        e.message.subject = "E-Mail bestaetigen - Marc's Trading Journal";
        e.message.html = buildVerificationEmail(verificationUrl, recipientAddress);
        e.message.text = [
          "Willkommen bei Marc's Trading Journal.",
          "Bitte bestaetige deine E-Mail-Adresse, um deinen Account zu aktivieren:",
          verificationUrl,
          "",
          "Wenn du dieses Konto nicht erstellt hast, kannst du diese E-Mail ignorieren.",
        ].join("\n");
      }
    }
  } catch (error) {
    $app.logger().error("Could not customize verification email", "error", error);
  }

  e.next();
});
