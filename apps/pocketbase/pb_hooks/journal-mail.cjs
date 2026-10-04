function escape(value) { return String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
exports.render = function(options) {
  const reset=options.kind==='reset';
  const title=reset?'Ein neues Passwort.':'Dein Journal wartet.';
  const action=reset?'Passwort zurücksetzen':'E-Mail bestätigen';
  const intro=reset?'Du hast einen Link zum Zurücksetzen deines Passworts angefordert.':'Willkommen bei The Trading Desk. Bestätige deine E-Mail-Adresse, um dein Konto zu aktivieren.';
  if(!/^https?:\/\//.test(options.url)) throw new Error('Invalid action URL');
  const url=escape(options.url);
  const html='<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark light"><title>'+action+'</title></head><body style="margin:0;background:#0e1116;font-family:Arial,Helvetica,sans-serif;color:#f5f2ea;">'+
  '<div style="display:none;max-height:0;overflow:hidden;">'+action+' für The Trading Desk.</div>'+
  '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0e1116;"><tr><td align="center" style="padding:40px 16px;">'+
  '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;"><tr><td align="center" style="padding:24px 20px 32px;color:#f5f2ea;font-size:16px;font-weight:bold;">TD<span style="color:#14e1b1;">.</span>&nbsp; The Trading Desk</td></tr>'+
  '<tr><td align="center" style="background:#141920;border-top:3px solid #14e1b1;padding:40px 24px 32px;"><h1 style="font-size:30px;line-height:1.2;margin:0 0 24px;color:#f5f2ea;">'+title+'</h1>'+
  '<p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#b6b1a2;">'+intro+'</p>'+
  '<p style="font-size:13px;line-height:1.6;color:#b6b1a2;overflow-wrap:anywhere;">'+escape(options.email)+'</p>'+
  '<table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px auto;"><tr><td align="center" bgcolor="#14e1b1" style="border-radius:4px;"><a href="'+url+'" style="display:inline-block;padding:17px 24px;font-size:16px;font-weight:bold;text-decoration:none;color:#0e1116;">'+action+'</a></td></tr></table>'+
  '<p style="margin:24px 0 0;font-size:13px;line-height:1.7;color:#b6b1a2;">Falls der Button nicht funktioniert, öffne diesen Link:</p>'+
  '<p style="font-size:12px;line-height:1.7;word-break:break-all;overflow-wrap:anywhere;"><a href="'+url+'" style="color:#14e1b1;text-decoration:underline;">'+url+'</a></p></td></tr>'+
  '<tr><td align="center" style="padding:28px 20px;font-size:12px;line-height:1.8;color:#b6b1a2;">Du hast diese Anfrage nicht gestellt? Dann ignoriere diese Nachricht.<br>Deine Zugangsdaten werden dadurch nicht geändert.<br><br>The Trading Desk · Dokumentieren. Verstehen. Verbessern.</td></tr></table></td></tr></table></body></html>';
  return {subject:action+' · The Trading Desk',html,text:intro+'\n\n'+action+':\n'+options.url+'\n\nFalls du diese Anfrage nicht gestellt hast, ignoriere diese Nachricht.'};
};
exports.customize = function(event,kind,configuredUrl) {
  const base=String(configuredUrl||event.app.settings().meta.appUrl||'').replace(/\/+$/,'');
  if(!/^https:\/\/[^/?#]+$/.test(base)&&!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(base)) throw new Error('APP_URL must be a trusted HTTPS origin (or local development origin).');
  if(!event.meta.token) throw new Error('PocketBase verification token missing.');
  const url=base+(kind==='reset'?'/reset-password':'/verify-pending')+'?token='+encodeURIComponent(event.meta.token);
  const content=exports.render({kind,url,email:event.record.email()});
  event.message.subject=content.subject;event.message.html=content.html;event.message.text=content.text;
  event.message.from.name='The Trading Desk';
};
