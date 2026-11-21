import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Bot, Copy, Check, KeyRound, Download, ShieldCheck, Trash2 } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const expiryOptions = [[30, '30 Tage'], [90, '90 Tage'], [365, '1 Jahr'], [null, 'Unbegrenzt']];
const dateLabel = value => value ? new Date(value).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
const dateTimeLabel = value => value ? new Date(value).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Noch nie';

function CopyButton({ value, label = 'Kopieren' }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    catch { toast.error('Kopieren nicht möglich. Bitte manuell markieren.'); }
  }
  return <Button type="button" variant="outline" size="sm" onClick={copy}>{copied ? <Check size={14} className="mr-1.5" /> : <Copy size={14} className="mr-1.5" />}{copied ? 'Kopiert' : label}</Button>;
}

export function aiPrompt(origin, key) {
  return `Du hast Lesezugriff auf mein Trading-Journal „The Trading Desk“.
API: ${origin}/api/v1 (Beschreibung: ${origin}/api/v1/openapi.json)
Authentifizierung: Header "Authorization: Bearer ${key}"

Wichtige Endpunkte:
- GET /me – Überblick
- GET /accounts – Konten, Kontotyp (private/prop) und Limits
- GET /summary?accountId=…&from=YYYY-MM-DD&to=YYYY-MM-DD – alle Kennzahlen
- GET /trades?from=…&to=…&perPage=200&page=… – Trades inkl. netR, Session, Notizen, Review und Screenshot-Links
- GET /trades/{id}/screenshots/{index} – Chart-Screenshot als Bild
- GET /missed-trades – nicht genommene Trades mit Grund

Analysiere meine Trades wie ein erfahrener Trading-Coach: Edge je Setup, Session und Grade, Risiko- und Regelverstöße, Ausführung (MFE/MAE), Psychologie und verpasste Chancen. Sieh dir die Screenshots meiner besten und schlechtesten Trades an. Nenne konkrete, priorisierte Verbesserungen mit Zahlen.`;
}

async function exportForAi() {
  const [accounts, trades, missed] = await Promise.all(['tradingAccounts', 'trades', 'missedTrades'].map(name => pb.collection(name).getFullList({ sort: 'created' }).catch(() => [])));
  const strip = ({ userId: _u, collectionId: _c, collectionName: _n, expand: _e, ...rest }) => rest;
  const shots = t => ['entryUrl', 'validationUrl', 'contextUrl'].filter(k => t[k]).map(k => ({ field: k, url: t[k] }));
  const data = {
    exportedAt: new Date().toISOString(), source: 'The Trading Desk', currency: 'EUR', timezone: 'Europe/Berlin',
    hint: 'R = Ergebnis / geplantes Risiko (riskAmount). Screenshots sind Links (z. B. TradingView). decision bei missedTrades: valid = bewusst ausgelassen, missed = verpasst.',
    accounts: accounts.map(strip), trades: trades.map(t => ({ ...strip(t), screenshots: shots(t) })), missedTrades: missed.map(strip),
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const link = Object.assign(document.createElement('a'), { href: url, download: `trading-journal-ki-export-${new Date().toISOString().slice(0, 10)}.json` });
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return trades.length;
}

export default function AiAccessSettings() {
  const supported = Boolean(pb.apiKeys);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(supported);
  const [name, setName] = useState('');
  const [expiry, setExpiry] = useState(90);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    if (!supported) return;
    try { setKeys((await pb.apiKeys.list()).items); }
    catch (error) { toast.error(error.message || 'Schlüssel konnten nicht geladen werden.'); }
    finally { setLoading(false); }
  }, [supported]);
  useEffect(() => { load(); }, [load]);

  async function create(e) {
    e.preventDefault(); setBusy(true);
    try {
      const result = await pb.apiKeys.create(name.trim(), expiry);
      setCreated(result); setName(''); await load();
    } catch (error) { toast.error(error.message || 'Schlüssel konnte nicht erstellt werden.'); }
    finally { setBusy(false); }
  }
  async function revoke(id) {
    try { await pb.apiKeys.revoke(id); setConfirming(null); if (created?.record.id === id) setCreated(null); toast.success('Schlüssel widerrufen. Er funktioniert ab sofort nicht mehr.'); await load(); }
    catch (error) { toast.error(error.message || 'Widerrufen fehlgeschlagen.'); }
  }
  async function download() {
    setExporting(true);
    try { const count = await exportForAi(); toast.success(`${count} Trades exportiert.`); }
    catch { toast.error('Export fehlgeschlagen.'); }
    finally { setExporting(false); }
  }

  return <div className="space-y-6">
    <ul className="grid gap-2 text-sm text-muted-foreground">
      <li className="flex gap-2"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-success" />Nur lesend: Die KI kann nichts ändern oder löschen.</li>
      <li className="flex gap-2"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-success" />Trades, nicht genommene Trades, Konten, Kennzahlen und Screenshots (TradingView-Links werden als Bild geliefert).</li>
      <li className="flex gap-2"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-success" />Jeder Schlüssel ist einzeln widerrufbar. Gib ihn nur Diensten, denen du deine Trading-Daten anvertraust.</li>
    </ul>

    {!supported ? <p className="rounded-md border p-4 text-sm text-muted-foreground">API-Schlüssel sind nur mit dem eigenen Journal-Server (MySQL) verfügbar. Den Datei-Export unten kannst du trotzdem nutzen.</p> : <>
      {created && <div className="ai-key-reveal" role="status">
        <p className="flex items-center gap-2 text-sm font-medium"><KeyRound size={16} />Neuer Schlüssel „{created.record.name}“ – nur jetzt sichtbar</p>
        <p className="text-xs text-muted-foreground">Kopiere ihn sofort. Gespeichert wird nur ein Fingerabdruck – wir können ihn dir später nicht mehr anzeigen.</p>
        <div className="flex flex-wrap items-center gap-2"><code className="ai-key-value">{created.key}</code><CopyButton value={created.key} label="Schlüssel kopieren" /></div>
        <details className="text-sm">
          <summary className="cursor-pointer font-medium text-primary">Fertige Anleitung für deine KI</summary>
          <pre className="ai-prompt">{aiPrompt(origin, created.key)}</pre>
          <CopyButton value={aiPrompt(origin, created.key)} label="Anleitung kopieren" />
        </details>
        <div><Button type="button" variant="ghost" size="sm" onClick={() => setCreated(null)}>Fertig, ich habe ihn gespeichert</Button></div>
      </div>}

      <form onSubmit={create} className="form-section space-y-4">
        <label className="form-field">Name des Schlüssels<Input value={name} onChange={e => setName(e.target.value)} maxLength={80} required placeholder="z. B. ChatGPT Analyse, Claude, Python-Skript" /></label>
        <div className="form-field"><span>Gültigkeit</span><div className="chip-group" role="group" aria-label="Gültigkeit">{expiryOptions.map(([value, label]) => <button key={label} type="button" aria-pressed={expiry === value} onClick={() => setExpiry(value)}>{label}</button>)}</div></div>
        <div className="flex justify-end"><Button disabled={busy || !name.trim()}><Bot size={15} className="mr-2" />{busy ? 'Wird erstellt…' : 'Schlüssel erstellen'}</Button></div>
      </form>

      <div>
        <h3 className="mb-2 text-sm font-medium">Aktive Schlüssel</h3>
        {loading ? <p className="text-sm text-muted-foreground">Lädt…</p> : !keys.length ? <p className="text-sm text-muted-foreground">Noch kein Schlüssel. Deine KI hat aktuell keinen Zugriff.</p> :
          <ul className="ai-key-list">{keys.map(key => {
            const expired = key.expiresAt && new Date(key.expiresAt) < new Date();
            return <li key={key.id}>
              <div className="min-w-0"><strong className="block truncate text-sm">{key.name}</strong>
                <span className="text-xs text-muted-foreground"><code>{key.prefix}…</code> · erstellt {dateLabel(key.created)} · zuletzt genutzt {dateTimeLabel(key.lastUsedAt)} · {expired ? <span className="text-destructive">abgelaufen</span> : key.expiresAt ? `gültig bis ${dateLabel(key.expiresAt)}` : 'unbegrenzt'}</span></div>
              {confirming === key.id ? <div className="flex shrink-0 gap-2"><Button type="button" size="sm" variant="destructive" onClick={() => revoke(key.id)}>Widerrufen</Button><Button type="button" size="sm" variant="ghost" onClick={() => setConfirming(null)}>Abbrechen</Button></div>
                : <Button type="button" size="sm" variant="outline" onClick={() => setConfirming(key.id)} aria-label={`Schlüssel ${key.name} widerrufen`}><Trash2 size={14} className="mr-1.5" />Widerrufen</Button>}
            </li>;
          })}</ul>}
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer font-medium">So verbindest du deine KI</summary>
        <div className="mt-3 space-y-3 leading-6 text-muted-foreground">
          <p><strong className="text-foreground">ChatGPT (eigener GPT):</strong> GPT erstellen → Konfigurieren → Aktionen → „Aus URL importieren“: <code>{origin}/api/v1/openapi.json</code>. Authentifizierung: API-Schlüssel, Typ „Bearer“.</p>
          <p><strong className="text-foreground">Claude Code, Cursor, Skripte:</strong> Anleitung oben kopieren und einfügen – oder direkt abrufen:</p>
          <pre className="ai-prompt">{`curl -H "Authorization: Bearer tdj_…" ${origin}/api/v1/summary`}</pre>
          <p><strong className="text-foreground">Chat ohne Internetzugriff:</strong> Nutze den Datei-Export und lade die Datei im Chat hoch.</p>
        </div>
      </details>
    </>}

    <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
      <p className="max-w-md text-sm text-muted-foreground">Datei-Export für KI-Chats: alle Konten, Trades und nicht genommenen Trades als JSON – zum Hochladen in ChatGPT, Claude &amp; Co.</p>
      <Button type="button" variant="outline" onClick={download} disabled={exporting}><Download size={15} className="mr-2" />{exporting ? 'Exportiert…' : 'Als Datei exportieren'}</Button>
    </div>
  </div>;
}
