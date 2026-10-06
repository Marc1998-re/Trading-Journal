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

CSV-Export ist vorhanden. Die neue API enthaelt einen administrativen CSV-Import
mit Trockenlauf und bestaetigter Kontozuordnung, noch keinen Dateiimport in der
Oberflaeche. Broker-Anbindung, offene Positionen, Ein-/Auszahlungen und
Waehrungsumrechnung sind noch nicht enthalten.

Weitere Hinweise:

- [Testleitfaden](docs/CONTENT-TEST-2026-09-30.md)
- [Helles und dunkles Design](docs/JOURNAL-THEMES.md)
- [Optionales Claude-Textwerkzeug](docs/CLAUDE-COPY.md)
