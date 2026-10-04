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

Das Backend ist PocketBase. Im Entwicklungsbetrieb leitet Vite
`/hcgi/platform` an `http://127.0.0.1:8090` weiter. Alternativ kann
`VITE_POCKETBASE_URL` in `apps/web/.env.local` gesetzt werden; eine Vorlage liegt
in `apps/web/.env.example`. Diese URL wird beim Frontend-Build eingebunden.

Geheimnisse gehoeren ausschliesslich in private Server-Konfigurationen oder
ignorierte lokale Umgebungsdateien, niemals in Git oder `VITE_*`-Variablen.
Das gilt insbesondere fuer SMTP-Zugang, PocketBase-Schluessel und den optionalen
Anthropic-API-Schluessel. Claude wird nur durch ein separates redaktionelles
Werkzeug aufgerufen und wird fuer den Journalbetrieb nicht benoetigt.

## Hostinger-Umzug

Ein Upload auf GitHub veroeffentlicht die Anwendung nicht automatisch auf einem
Hostinger-Server. Die konkrete Einrichtung erfolgt erst nach Pruefung des VPS,
seines Betriebssystems, vorhandener Dienste und der zu uebernehmenden Daten.

Vor einer Umschaltung sind erforderlich:

- Sicherung und Wiederherstellungstest der bisherigen PocketBase-Daten inklusive
  hochgeladener Dateien; keine produktive Datenbank in dieses Repository laden.
- Migrationstest mit der passenden PocketBase-Version in einer getrennten
  Umgebung. Das Repository stammt aus Horizons und enthaelt noch dessen
  Betriebs-Hilfsskripte; diese sind keine fertige VPS-Konfiguration.
- Dauerhafter Backend-Datenspeicher, HTTPS, eingeschraenkter Admin-Zugang und
  automatische Backups auf dem Server.
- SMTP-Konfiguration und echte Tests fuer Registrierung, Bestaetigungsmail,
  Passwort-Reset, Login und Datenspeicherung.
- Erst danach Domain/DNS umstellen. Das bisherige Journal bis zum erfolgreichen
  Umzug weiterlaufen lassen.

Die ausfuehrliche Backend- und Mail-Checkliste steht in
[JOURNAL-UPGRADE.md](JOURNAL-UPGRADE.md).

## Aktueller Funktionsumfang

Auswertungen beziehen sich bewusst auf das Einstiegsdatum erfasster,
abgeschlossener Trades in EUR. Kosten, urspruengliches Risiko und die Herkunft
verwendeter Risikowerte werden beruecksichtigt. Die Infofelder in der Anwendung
erklaeren Berechnung und Interpretation.

CSV-Export ist vorhanden. Broker-Anbindung, Dateiimport, offene Positionen,
Ein-/Auszahlungen und Waehrungsumrechnung sind noch nicht enthalten.

Weitere Hinweise:

- [Testleitfaden](docs/CONTENT-TEST-2026-09-30.md)
- [Helles und dunkles Design](docs/JOURNAL-THEMES.md)
- [Optionales Claude-Textwerkzeug](docs/CLAUDE-COPY.md)
