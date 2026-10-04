# Inhaltspaket: Reviews und Zeitraeume

Stand: 30.09.2026. Lokal umgesetzt, nicht auf Horizons oder Produktion veroeffentlicht.

## Aenderungen

- Review-Status offen, Entwurf, abgeschlossen; bestehende Notizen werden als Entwurf eingeordnet, nicht als abgeschlossener Review.
- Optionale Setup-/Risiko-Checks und sechs Lern-Tags. Ein Abschluss erfordert eine Erkenntnis und einen naechsten Schritt.
- Wiedereroeffnen bewahrt die Inhalte und entfernt den Abschlusszeitpunkt. PocketBase validiert Abschluesse und setzt den Zeitpunkt serverseitig.
- Rueckblick fuer Woche oder gewaehlten Zeitraum mit Tag-Haeufigkeiten aus abgeschlossenen Reviews und konkreten naechsten Schritten. Keine abgeleiteten Qualitaets-Scores oder Kausalitaetsbehauptungen.
- Gemeinsame Auswahl von Woche, Monat, Gesamt und Von/Bis. Beide ausgewaehlten Tage zaehlen mit; Anfangskapital beruecksichtigt fruehere Netto-Ergebnisse. Zuordnung ausdruecklich nach Einstiegsdatum, nicht Abschlussdatum.
- Strukturierte Review-Felder im CSV. Formelartige Texte werden auch in den neuen Spalten entschaerft.
- Anklickbare Kennzahlen-Erklaerungen, klarere Landingpage-Texte und Demo-Reviews im Sitzungsspeicher. Kein neuer kostenpflichtiger Claude-Aufruf.
- Nichtmonatische Handelstage chronologisch absteigend statt nach Ergebnis sortiert. Wochenlabel fuer schmale Ansichten verbreitert.

## Verifikation

- 57 Node-Tests inklusive Review-Validierung, CSV, Datumsgrenzen, Schaltjahr, Wochen ueber Jahresgrenzen und Kapitalbasis.
- Isolierte PocketBase-0.40.4-Instanz: Migrationen wiederholt anwendbar, alte Notizen erhalten, unvollstaendiger Abschluss/ungueltiger Tag abgelehnt, Entwurf/Abschluss/Wiedereroeffnung, Zeitstempel gegen Ueberschreiben geschuetzt, unautorisierte Schreibversuche abgelehnt.
- Bestehende Authentifizierung und Verifizierungs-/Reset-Mails im lokalen SMTP-Test ebenfalls erfolgreich. Das belegt NICHT die Zustellung des produktiven Mailservers.
- Browser: Review entwerfen, ungespeicherten Seitenwechsel abbrechen, abschliessen, Tag-Zaehler aktualisieren und wieder oeffnen; Demo nach Neuladen zurueckgesetzt.
- Browser: Woche 24.-30.08. und gleicher freier Zeitraum zeigen 12 Trades, 14.028 EUR Anfangskapital, 1.007 EUR Netto bzw. 7,18 Prozent. Auswahl bleibt zwischen Review und Uebersicht bestehen.
- Desktop 1360 x 950, mobile Ansichten 390 und 320 Pixel; keine horizontalen Seitenueberlaeufe im geprueften Review. Hell/dunkel und anklickbare Kennzahlenhilfe kontrolliert; keine Warnungen oder Fehler in der Browserkonsole bei den geprueften Ablaeufen.
- Produktionsbuild erfolgreich; die bestehende Vite-Warnung ueber grosse Bundles bleibt. Kein Deployment.

## Vor echtem Einsatz

Die neue Migration `apps/pocketbase/pb_migrations/1790640000_structured_reviews.js` und der Hook `apps/pocketbase/pb_hooks/structured-review.pb.js` muessen zusammen mit dem Frontend auf den Zielserver. Vorher Backup und Staging-Test. Die Migration ergaenzt Felder und schreibt keine vorhandenen Reviews um; ein Rollback loescht keine Review-Inhalte.

Fehlen die Felder auf dem Server, zeigt der Editor einen Fehler statt einen vollstaendigen Speichererfolg zu behaupten. Die lokale Demo benoetigt dafuer keinen Server.

## Kleiner Praxistest

1. In der Demo einen offenen Review waehlen und nur eine Notiz als Entwurf speichern.
2. Erkenntnis und naechsten Schritt ergaenzen, einen Lern-Tag setzen und abschliessen.
3. Rueckblick und Statuszaehler pruefen, danach den Review wieder oeffnen.
4. Ungespeicherte Eingaben machen und einen Seitenwechsel abbrechen: Inhalt muss bleiben.
5. Woche und eigenen Zeitraum testen, dann in der Uebersicht zwischen EUR und Prozent wechseln.
6. Auf dem Handy pruefen, ob Liste, Felder und Abschliessen bequem erreichbar sind.

Broker-/Plattform-Import, separate Abschlussdaten, Zahlungsstrombereinigung und Produktions-Mailzustellung sind nicht Bestandteil dieses Pakets. Die vorhandenen Landingpage-Screenshots wurden in diesem Paket nicht neu aufgenommen.
