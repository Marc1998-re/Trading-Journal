# The Trading Desk

Deutschsprachiges Trading Journal mit manueller Trade-Erfassung, mehreren Konten,
Risiko- und Ergebnisanalyse, strukturierten Reviews und einer interaktiven Demo.

## Lokal starten

Voraussetzung: Node.js 22.12 oder neuer und npm.

```sh
npm ci
npm run dev
```

Die Terminal-Ausgabe nennt die lokale Adresse. Unter `/demo` arbeitet die Anwendung
mit fiktiven Daten; dafuer ist keine Datenbank notwendig. Die Landingpage liegt
unter `/`.

```sh
npm test
npm run lint
npm run build
```

Der Frontend-Build liegt danach in `dist/apps/web`. `vite preview` ist nur eine
lokale Vorschau und kein Produktionsserver.

## Echte Konten und Daten

Der neue Standard ist eine Node.js-/Express-API mit MySQL/MariaDB unter
`apps/api`. Sie verwaltet Konten, Trades, Reviews und die Anmeldung ueber
HttpOnly-Cookies. Die Demo bleibt unabhaengig von der Datenbank.

Die Vorlage `apps/api/.env.example` beschreibt die private Server-Konfiguration.
Mit lokaler Datenbank und konfiguriertem SMTP:

```sh
npm run db:migrate
npm run dev:full
```

Das Frontend startet auf Port 4189, die API auf 4190. Vite leitet `/api` an die
lokale API weiter. Auf Produktion liefert Express Frontend und API unter
derselben HTTPS-Domain aus. `npm start` setzt bereits ausgefuehrte Migrationen
voraus; `npm run start:hostinger` fuehrt sie vor dem HTTP-Start aus.

PocketBase ist als ausdrueckliche Rueckfalloption erhalten: Mit
`VITE_DATA_BACKEND=pocketbase` und `VITE_POCKETBASE_URL` das Frontend neu bauen.
`npm run dev:pocketbase` nutzt den bisherigen lokalen Startweg. Diese Option
wandelt keine Daten automatisch zwischen den beiden Datenbanken um.

Geheimnisse gehoeren ausschliesslich in private Server-Konfigurationen oder
ignorierte lokale Umgebungsdateien, niemals in Git oder `VITE_*`-Variablen.
Das gilt insbesondere fuer MySQL-/SMTP-Zugang, PocketBase-Schluessel und den optionalen
Anthropic-API-Schluessel. Claude wird nur durch ein separates redaktionelles
Werkzeug aufgerufen und wird fuer den Journalbetrieb nicht benoetigt.

## Hostinger-Umzug

Ziel ist das vorhandene Business-Webhosting mit einer serverseitigen Node.js-App
und einer Hostinger-MySQL-Datenbank, ohne zusaetzlichen PocketBase-VPS. Die genaue
Konfiguration und Freigabe-Checkliste steht in
[HOSTINGER-MYSQL.md](docs/HOSTINGER-MYSQL.md).

Noch ist damit nichts auf Hostinger veroeffentlicht. GitHub-Push, neue Testwebsite,
Datenbank, SMTP, Datenimport und Domain-Umschaltung sind getrennte Schritte.
Horizons nicht loeschen, bevor Backup und Testwebsite nachweislich funktionieren.
Der echte MySQL-Integrationstest und Tests mit einem echten Mail-Empfaenger sind
Freigabevoraussetzungen.

## Aktueller Funktionsumfang

Auswertungen beziehen sich bewusst auf das Einstiegsdatum erfasster,
abgeschlossener Trades in EUR. Kosten, urspruengliches Risiko und die Herkunft
verwendeter Risikowerte werden beruecksichtigt. Die Infofelder in der Anwendung
erklaeren Berechnung und Interpretation.

### Profi-Funktionen (Branch `feature/pro-journal`)

- **Performance-Cockpit:** KPI-Kacheln (Netto, Profitfaktor, Trefferquote, Erwartungswert, Drawdown),
  Disziplin-Score, Kennzahlen-Raster (SQN, Ø Gewinn/Verlust in R, Serien, Handelstage, Kosten) und
  Handelskalender mit Wochensummen.
- **Kontotypen:** Privatkapital oder Prop-Firm. Pro Konto Tagesverlust-Limit, max. Verlust
  (statisch oder trailing), Gewinnziel, max. Risiko je Trade und max. Trades pro Tag. Die Übersicht
  zeigt den verbleibenden Puffer auf Basis realisierter Trades (Floating-P&L ist nicht enthalten).
- **Nicht genommene Trades:** eigenes Log mit Grund, Bewertung (bewusst ausgelassen / verpasst) und
  hypothetischem Ergebnis in R. Fließt nicht in Kontostand oder Statistiken ein.
- **Optionale Profi-Angaben je Trade:** Ausstieg (Haltedauer), geplantes Ziel in R, MAE/MFE,
  Setup-Note A/B/C, Emotion und Überzeugung.
- **Analyse in Tabs:** Überblick, R & Risiko, Setups & Märkte (inkl. A/B/C, Long/Short), Timing
  (Sessions, Stunden-Heatmap, Wochentage, Haltedauer), Ausführung (MFE/MAE, Gewinnausschöpfung,
  Ziel erreicht) und Psychologie (Regeltreue, Emotion, Überzeugung, Lern-Tags).

Datenbank: `apps/api/migrations/002_pro_journal.sql` ergänzt Trade- und Kontospalten sowie die
Tabelle `missedTrades`. `npm run db:migrate` bzw. `npm run start:hostinger` führt sie aus. Vorher
ein Datenbank-Backup anlegen. Die PocketBase-Rückfalloption unterstützt diese Erweiterungen nicht.

### KI-Zugriff (API-Schlüssel)

Unter Einstellungen → KI-Zugriff erstellen Nutzer persönliche API-Schlüssel – wahlweise **nur lesen**
oder **lesen & erfassen** (`tdj_…`, Gültigkeit 30/90/365 Tage oder unbegrenzt, max. 10 aktive, jederzeit widerrufbar). Der
Schlüssel wird einmal angezeigt; gespeichert wird nur sein SHA-256-Hash (`apiKeys`, Migration
`003_api_keys.sql`).

- `GET /api/v1/openapi.json` – öffentliche OpenAPI-Beschreibung (z. B. Import als ChatGPT-Aktion)
- `GET /api/v1/me`, `/accounts`, `/summary`, `/trades`, `/trades/{id}`, `/missed-trades`
- `GET /api/v1/trades/{id}/screenshots/{index}` – TradingView-Snapshots als Bild (nur
  `s3.tradingview.com`, keine anderen Hosts – kein SSRF); andere Bild-Links stehen als `imageUrl`
  in den Trades.
- Nur mit Schreibrecht: `POST /api/v1/trades` und `/missed-trades` (ein Eintrag oder
  `{ "items": [...] }`, max. 200, alles oder nichts), `PATCH /api/v1/trades/{id}` und
  `/missed-trades/{id}`. `?dryRun=true` prüft ohne Speichern; gleiche Einträge (Konto, Symbol,
  Richtung, Einstieg) werden mit 409 abgelehnt, außer mit `?allowDuplicates=true`. `GET /api/v1/schema`
  liefert alle Felder mit Erklärung. Löschen ist über Schlüssel nie möglich (405).
- Authentifizierung: `Authorization: Bearer tdj_…` oder `X-API-Key`. 120 Anfragen/Minute je
  Schlüssel (Schreiben zusätzlich 60/Minute), CORS offen (keine Cookies).

Ohne eigenen Server gibt es zusätzlich einen JSON-Datei-Export zum Hochladen in KI-Chats.

CSV-Export ist vorhanden. Die neue API enthaelt einen administrativen CSV-Import
mit Trockenlauf und bestaetigter Kontozuordnung, noch keinen Dateiimport in der
Oberflaeche. Broker-Anbindung, offene Positionen, Ein-/Auszahlungen und
Waehrungsumrechnung sind noch nicht enthalten.

Weitere Hinweise:

- [Testleitfaden](docs/CONTENT-TEST-2026-09-30.md)
- [Helles und dunkles Design](docs/JOURNAL-THEMES.md)
- [Optionales Claude-Textwerkzeug](docs/CLAUDE-COPY.md)
