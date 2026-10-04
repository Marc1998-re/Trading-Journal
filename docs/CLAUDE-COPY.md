# Claude fuer die Oberflaechentexte

Die Anbindung ist ein lokales Redaktionswerkzeug, kein oeffentlicher API-Endpunkt
und keine KI-Funktion fuer private Trade-Notizen. Sie verwendet die offizielle
[Anthropic Messages API](https://platform.claude.com/docs/en/api/messages/create).

## Einrichtung

1. In der [Claude Console](https://platform.claude.com/) ein Konto und einen
   API-Schluessel anlegen. API-Abrechnung aktivieren und ein kleines Ausgabenlimit
   setzen. Ein Claude-Chat-Abo enthaelt kein API-Guthaben.
2. Im Projektstamm `.env.claude.local` oeffnen. Den Schluessel ausschliesslich nach
   `ANTHROPIC_API_KEY=` eintragen. Nicht in den Chat und nicht in `apps/web`.
   `.env.claude.example` ist die Vorlage fuer andere Arbeitsplaetze.
3. Node.js 22.9 oder neuer verwenden. Empfohlen ist Node.js 24.

`CLAUDE_MODEL` ist konfigurierbar; voreingestellt ist `claude-sonnet-5`.
Modellverfuegbarkeit und Kosten haengen vom Anthropic-Konto ab.
Der Schluessel wird nicht benoetigt, um die Anfrage vorab anzusehen.

## Ablauf

```bash
npm run copy:preview
npm run copy:preview -- --section=dashboard
```

Das zeigt exakt den Request-Body, der an Anthropic gehen wuerde. Es findet kein
API-Aufruf statt. Kein Schluessel und kein Authentifizierungsheader werden ausgegeben.

Erst dieser Befehl sendet einen kostenpflichtigen Auftrag:

```bash
npm run copy:review
npm run copy:review -- --section=dashboard
```

Moegliche Bereiche: landing, dashboard, analysis, charts, trades, review, login,
signup, settings. Die erste Auswahl enthaelt 24 gezielt kuratierte Texte, nicht
saemtliche UI-Texte. Weitere Texte koennen spaeter bewusst ergaenzt werden.

Die Resultate landen als JSON in `.claude-reviews/`, mit Original, Vorschlag,
Begruendung und gemeldeter Token-Nutzung. Sie sind als **nicht angewendet**
markiert. Wir pruefen Inhalt und Laenge und uebernehmen passende Vorschlaege
anschliessend gezielt in den Code. Danach Build und Layout erneut testen.

## Schutzvorkehrungen

- Nur freigegebene Texte aus `content/copy-review.de.json` werden versendet.
  Keine Quelldateien, Datenbank, Trade-Daten, E-Mails, Passwoerter oder Kontowerte.
- Die Originaltexte werden vorab lokal gegen den Quellcode geprueft.
- Der Aufruf laeuft nur lokal in Node, niemals im Frontend oder beim Seitenaufruf.
- Maximal 40 Texte, 24.000 Eingabezeichen und 4.096 Ausgabetokens pro Aufruf.
  Das ist kein fester Euro-Betrag; API-Preise gelten zusaetzlich.
- Keine automatischen Wiederholungen. Nach Timeout vor erneutem Senden die
  Console-Nutzung pruefen: ein bereits verarbeiteter Auftrag kann berechnet werden.
- Unvollstaendige Antworten, fremde/duplizierte IDs, ueberlange Vorschlaege und
  HTML werden abgelehnt. Keine automatische Codeausfuehrung oder Dateiuebernahme.
- Schluessel und generierte Entwuerfe sind in Git ausgeschlossen.
- Die Vorschlaege sind nicht vertrauenswuerdiger als andere externe Inhalte:
  Fakten, Produktversprechen und Fachbegriffe vor der Uebernahme kontrollieren.

Tests: `npm test` (inklusive simuliertem API-Erfolg, Fehlern und Datenschutzpruefungen).
Der erste erfolgreiche API-Aufruf und die geprueften Aenderungen sind in
[COPY-REVIEW-2026-09-23.md](./COPY-REVIEW-2026-09-23.md) dokumentiert.

Quellen: [Strukturierte Antworten](https://platform.claude.com/docs/en/build-with-claude/structured-outputs),
[Modelle](https://platform.claude.com/docs/en/models/overview),
[separate API-Abrechnung](https://support.claude.com/en/articles/9876003-i-have-a-paid-claude-subscription-pro-max-team-or-enterprise-plans-why-do-i-have-to-pay-separately-to-use-the-claude-api-and-console).
