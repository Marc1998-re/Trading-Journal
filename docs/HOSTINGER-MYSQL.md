# The Trading Desk: Hostinger Business mit MySQL

## Ziel und Status

React/Vite-Frontend, Express-API und MySQL/MariaDB ersetzen fuer das neue
Deployment den Horizons-/PocketBase-Betrieb. Die API liegt in `apps/api`, die
Tabellen in `apps/api/migrations`. Die bisherigen Berechnungen und das Design
bleiben unveraendert. Trades werden weiterhin nach Einstiegsdatum ausgewertet.

Die Umstellung ist vorbereitet, aber noch nicht live. Am 2026-10-05 bestanden
alle 96 regulaeren Tests sowie alle 13 Integrationstests gegen lokales MySQL
8.4.11. Der Integrationstest prueft unter anderem Migrationen, Anmeldung,
Verifizierung, Passwort-Reset, Nutzertrennung, Reviews, Pagination und atomare,
wiederholbare CSV-Imports einschliesslich eines spaeten Fehlers mit Rollback.
Testdatenbanken werden nach jedem Durchlauf entfernt. Mails wurden ausschliesslich
ueber einen lokalen Test-SMTP-Server geprueft, nicht an echte Postfaecher zugestellt.

Hostinger-Laufzeit, produktive Server-Konfiguration, echte Mailzustellung und
Backups muessen vor einem Domainwechsel noch geprueft werden. Es wurden keine
echten Nutzer angelegt, keine Handelsdaten importiert und keine DNS-Eintraege
veraendert.

Hostinger dokumentiert [Node.js-Apps auf Business-Webhosting](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/)
und die [Anbindung einer Hostinger-MySQL-Datenbank](https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/).
Verfuegbarkeit und Ressourcen des konkreten bestehenden Tarifs zuerst in hPanel
pruefen. Dieses Deployment benoetigt keinen dauerhaft laufenden PocketBase-Prozess.

## Vorbereiten

1. Aktuelle Horizons-Daten exportieren und privat sichern. Den vorhandenen
   korrigierten Trade-Export nicht durch einen neuen unbereinigten Export ersetzen.
2. Fuer jede der drei Konto-IDs Namen, Startkapital und EUR als Kontowaehrung
   bestaetigen. Fehlende Zuordnungen blockieren den Import bewusst.
3. Eine leere MySQL-Datenbank und einen separaten Benutzer mit Rechten nur auf
   diese Datenbank anlegen. Keine produktiven Tabellen wiederverwenden.
4. Eine getrennte Node.js-Testwebsite mit HTTPS in Hostinger anlegen. Eine neue
   Testdomain/Subdomain verwenden, damit Horizons bis zur Freigabe erreichbar bleibt.
5. Einen SMTP-Zugang und eine erlaubte Absenderadresse bereitstellen. Absendername
   ist `The Trading Desk`, die Adresse wird ueber `SMTP_FROM` gesetzt.

## Deployment-Einstellungen

Das gesamte Repository aus GitHub verwenden, nicht nur `apps/web` oder dessen
Build. Keine private `.env`, CSV, Datenbanksicherung oder API-Schluessel hochladen.

Empfohlene Konfiguration fuer den ersten Test:

| Einstellung | Wert |
| --- | --- |
| Node.js | 24.x, mindestens 22.12 |
| Projektverzeichnis | Repository-Wurzel |
| Typ | Serverseitige Express-App oder `Other`, nicht statisches Vite-Hosting |
| Build | `npm run build` mit installierten Workspace- und Build-Abhaengigkeiten |
| Einstieg | `server.mjs` in der Repository-Wurzel |
| Start, falls abfragbar | `npm run start:hostinger` |
| Statische Dateien | `dist/apps/web`, nur dieses Verzeichnis wird von Express freigegeben |

Der Build braucht auch `devDependencies` wie Vite und Tailwind. Falls der
Hostinger-Installationsschritt diese wegen `NODE_ENV=production` auslaesst,
`NPM_CONFIG_INCLUDE=dev` fuer das Deployment setzen. Diese Werkzeuge sind keine
API-Laufzeitkomponenten; `tailwindcss-animate` wird ausschliesslich beim CSS-Build
als Plugin geladen.

Der Startpunkt `server.mjs` wendet ausstehende Migrationen unter einer
Datenbanksperre an und startet erst dann HTTP. Ein fehlgeschlagener Start darf
nicht als erfolgreicher Umzug gewertet werden. Bereits angewandte Migrationen
werden ueber Namen und SHA-256-Pruefsumme erkannt; alte Dateien nach Anwendung
nicht veraendern, sondern neue Migrationen erstellen. HTTP-Anfragen fuehren keine
Schemaaenderungen aus.

Hostinger erlaubt laut Dokumentation keine interaktiven npm-Befehle per SSH;
deshalb ist dieser Startpunkt vorgesehen. Die genaue Behandlung des Monorepos
und des Ausgabeverzeichnisses muss im ersten Testdeployment geprueft werden:
Backend-Quelldateien, Workspace-Abhaengigkeiten und `dist/apps/web` muessen alle
im Node.js-Laufzeitverzeichnis bleiben. Nicht ausschliesslich das statische
Ausgabeverzeichnis deployen. Falls hPanel eine Output-Directory-Auswahl erzwingt,
mit dem Support die vollstaendige Express-Ausgabe klaeren.

## Server-Konfiguration

Die vollstaendige Vorlage liegt in `apps/api/.env.example`. In hPanel als private
Umgebungsvariablen hinterlegen; fuer lokale Arbeit `apps/api/.env.local` verwenden.

- `NODE_ENV=production` und `HOST=0.0.0.0`.
- `PORT` entsprechend Hostingers Laufzeitvorgabe, nicht willkuerlich festsetzen.
- `APP_URL` ist die genaue HTTPS-Origin der Testwebsite, ohne Pfad und ohne
  abschliessenden Slash. Nach Domainwechsel aktualisieren.
- `TRUST_PROXY=1` nur bei genau einem vertrauenswuerdigen vorgeschalteten Proxy.
  Hostingers Proxy-Konfiguration pruefen, damit IP-Limits korrekt arbeiten.
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` aus hPanel; nicht
  automatisch `localhost` annehmen. Zunaechst `DB_POOL_SIZE=5`.
- Jede Datenbankverbindung verwendet UTC fuer technische Zeitstempel; das vom
  Nutzer erfasste Einstiegsdatum und die Einstiegszeit werden nicht verschoben.
- Remote-TLS nach Anbieteranforderung ueber `DB_SSL` und optional `DB_SSL_CA_FILE`.
  Keine abgeschaltete Zertifikatspruefung.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`
  passend zum echten Mailanbieter. Port 465 ueblicherweise mit TLS ab Verbindung;
  Port 587 mit STARTTLS. Zugang und erlaubten Absender beim Anbieter bestaetigen.
- `VITE_DATA_BACKEND=mysql`, `VITE_API_URL=/api` beim Frontend-Build. Geheimnisse
  niemals in `VITE_*` setzen; diese Werte sind oeffentlich im Browser sichtbar.

Frontend und API muessen unter derselben Domain liegen. Es gibt absichtlich kein
Wildcard-CORS. Login verwendet serverseitige Sitzungen mit `HttpOnly`, `Secure`
bei HTTPS, `SameSite=Lax` und siebentaegiger Laufzeit. Schreibanfragen verlangen
eine passende Origin. Anmeldung wird erst nach bestaetigter E-Mail freigegeben.
Die Passwort-Hashes enthalten Salz und Kostenparameter. Maximal zwei
speicherintensive Hash-Berechnungen laufen gleichzeitig; eine volle Warteschlange
liefert einen sichtbaren 503-Fehler statt unbegrenzt Speicher zu beanspruchen.

## Nutzer und CSV uebernehmen

Passwoerter koennen aus dem Trade-CSV nicht uebernommen werden. Der neue Nutzer
bestaetigt seine Adresse und setzt ein neues Passwort ueber Einmal-Links. Kein
Standardpasswort und kein automatisches `verified=true`.

Ein administratives Werkzeug steht fuer eine vertrauenswuerdige lokale Umgebung
mit privater Datenbank-Konfiguration bereit:

```sh
npm run invite --workspace journal-api -- --email DEINE_ADRESSE --name Marc
```

Es prueft SMTP, legt bei Bedarf einen Nutzer mit unbekanntem Zufallspasswort an
und fordert Bestaetigung und Passwort-Einrichtung an. Vorhandene Passwoerter und
Verifizierungszustaende werden nicht ueberschrieben. Der Befehl zeigt nur die
Nutzer-ID. Datenbank-Remotezugriff aus hPanel nur fuer die benoetigte IP erlauben
und anschliessend wieder entfernen; keine oeffentliche Administrationsroute.
Falls direkter Zugriff nicht verfuegbar ist, normalen Registrierungsweg verwenden
und den privaten Import erst nach Klaerung eines sicheren Zugangs ausfuehren.

Private Kontozuordnung im JSON-Format:

```json
{
  "accounts": [
    {
      "sourceAccountId": "QUELL_KONTO_ID",
      "accountName": "BESTAETIGTER_KONTONAME",
      "startingBalance": 100000,
      "currency": "EUR"
    }
  ]
}
```

Alle im CSV vorkommenden Konten muessen enthalten sein. Der Betrag im Beispiel
ist kein Standardkapital fuer andere Konten.

```sh
npm run import:csv --workspace journal-api -- --file /privat/trades.csv --accounts /privat/konten.json --user-id NUTZER_ID
```

Ohne `--apply` wird nur validiert, nichts geschrieben. Erst nach geprueftem
Trockenlauf den gleichen Befehl mit `--apply` ausfuehren. Der gesamte Import ist
eine Transaktion. Derselbe unveraenderte Export kann erneut eingelesen werden,
ohne die Trades zu duplizieren; identische einzelne Trades innerhalb einer Datei
bleiben anhand ihrer Vorkommenszahl erhalten. Ein spaeter geaenderter Export ist
keine automatische Aktualisierung und muss gesondert abgeglichen werden.

Historische Euro-Ergebnisse und urspruengliches Risiko werden nicht neu berechnet.
Leere Kostenfelder bleiben unbekannt, nicht bestaetigt null. Kontobestaende,
Trade-Anzahlen und Summen pro Konto nach dem Import mit der Quelle vergleichen.
Das alte CSV beinhaltet keine Reviews, Theme-Einstellungen oder Nutzerpasswoerter;
diese Daten sind daher nicht Bestandteil des Imports.

## Freigabe und Betrieb

- `npm test`, `npm run lint` und `npm run build` erfolgreich ausfuehren.
- Echter Integrationstest lokal gegen eine ausschliessliche Testdatenbank:
  `MYSQL_TEST_URL=mysql://TESTBENUTZER:PASSWORT@127.0.0.1:PORT npm run test:mysql`.
  Der Test legt eine neue `td_test_*`-Datenbank an und loescht nur diese danach.
  Der Testbenutzer braucht dafuer CREATE-/DROP-DATABASE-Rechte, nie den
  produktiven Datenbankbenutzer verwenden. Keine Shell-History mit echten Secrets.
- Neue Website: `/api/health` liefert MySQL-Status; API-404 bleibt JSON.
  Direkte Aufrufe von `/demo`, `/login`, `/dashboard`, `/review` und der
  Token-Routen funktionieren als SPA-Routen. Nach Login Reload pruefen.
- Zwei Testnutzer: fremde Trades/Konten duerfen weder lesbar noch aenderbar sein.
- Echte Mails: Registrierung, erneuter Versand, Bestaetigung, Ablauf/Einmaligkeit,
  Passwort-Reset. HTML und Textversion kontrollieren. SMTP-Annahme bedeutet noch
  keine Zustellung im Posteingang; SPF/DKIM/DMARC und Spamordner pruefen.
- Trade anlegen, bearbeiten, loeschen; Review speichern/abschliessen/oeffnen;
  Kontowechsel, atomare Kontozusammenfuehrung und CSV-Export testen.
- Mobil sowie Light-/Dark-Mode pruefen. Bei Browser-/Serverfehlern nicht umschalten.
- Datenbank-Backups und Wiederherstellung auf einer separaten Datenbank testen;
  GitHub sichert keine Nutzerdaten. Aufbewahrungsfristen und Zugriff festlegen.
- Abgelaufene Sitzungen, Mailtokens und IP-Limits werden beim Serverstart und
  stuendlich begrenzt aufgeraeumt. Aktive Tokens und Handelsdaten bleiben erhalten.
  `npm run db:cleanup` ist fuer zusaetzliche manuelle Wartung vorhanden.
- Ressourcen, Fehlerrate und DB-Latenz beobachten. MySQL schafft eine brauchbare
  Wachstumsperspektive, aber kein fixer Tarif garantiert eine bestimmte Nutzerzahl.
  Vor groesserem Rollout Lasttests und einen spaeteren Upgrade-/Migrationsweg planen.

Erst nach diesen Tests die bisherige Domain umstellen. Falls Hostinger fuer die
gleiche Domain eine Website-Entfernung verlangt, vorher vollstaendige Backups
inklusive Datenbanken und Mailkonfiguration erstellen und den Ablauf mit dem
Support abstimmen. Keine Loeschung allein wegen eines scheinbar fertigen Builds.

Der aktuelle `npm audit --omit=dev` meldet keine Laufzeit-Schwachstellen.
Der vollstaendige Audit meldet weiterhin fuenf hohe Warnungen in der vorhandenen
Tailwind-3-Buildkette (verschachtelte Glob-Muster). Diese Werkzeuge werden nicht
von HTTP-Anfragen aufgerufen, brauchen aber gesondert getestete Updates. Ein
ungepruefter Tailwind-4-Wechsel wird nicht automatisch erzwungen. Der kompatible
`brace-expansion`-Sicherheitspatch wurde bereits eingespielt. Audits vor jedem
Produktionsdeployment erneut ausfuehren; dieses Ergebnis ist kein Security-Audit
der gesamten Anwendung.
