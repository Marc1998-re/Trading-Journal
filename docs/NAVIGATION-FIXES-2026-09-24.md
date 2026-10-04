# Erstes Korrekturpaket: Navigation und Review

Stand: 24. September 2026. Lokaler Code und lokale Vorschau; nicht auf Horizons veroeffentlicht.

## Umgesetzt

- Explizite Review-IDs oeffnen genau diesen Trade, auch ausserhalb des Monats oder des Notizfilters. Unbekannte IDs und Trades ausserhalb des ausgewaehlten Kontos ergeben keinen stillen Ersatz durch einen anderen Trade.
- Ein Hinweis erklaert den abweichenden Zeitraum; ein Button wechselt zum Monat des Trades. Datum, Uhrzeit und Konto stehen beim Editor.
- Monat und Gesamtansicht werden innerhalb der Journal-Sitzung gemeinsam gehalten. Demo und Benutzerwechsel erhalten getrennte Anfangszustaende. Vollstaendiges Neuladen setzt den Zeitraum zurueck; er ist noch nicht in der URL oder dauerhaft gespeichert.
- Ungespeicherte Review-Notizen erhalten eine Verwerfen-Abfrage bei Routen-, Trade-, Monats-, Konto- und Listenfilterwechsel, manuellem Aktualisieren und Abmelden. Waehrend des Speicherns wird der Wechsel blockiert. Reload/Tab-Schliessen verwenden den nativen beforeunload-Schutz.
- Speicherfehler lassen den Text erhalten. Nach Erfolg wird nur der zurueckgegebene Trade aktualisiert. Kein stilles Autosave und keine dauerhafte lokale Speicherung sensibler Entwuerfe.
- Die Review-Seite zaehlt jetzt ehrlich "Trades mit Notiz", nicht automatisch abgeschlossene Reviews.

## Verifikation

- 44 Node-Tests erfolgreich, davon 11 neue Navigationstests.
- Gezielter ESLint-Lauf auf den geaenderten Anwendungsmodulen erfolgreich.
- Produktions-Build erfolgreich. Die bestehende Warnung zu grossen Chunks bleibt bestehen.
- Im Browser: Juli von Uebersicht zu Analyse/Review/Verlaeufen erhalten; Monatsauswahl aus Verlaeufen zu Analyse erhalten; Gesamtansicht zu Uebersicht erhalten.
- Juli-Direktlink zeigt XAU/USD vom 16. Juli statt GBP/USD vom August. Unbekannte ID zeigt keinen Editor. Separater Kontofilter blendet einen nicht zugehoerigen Trade aus, statt einen anderen zu bearbeiten.
- Isolierte Testansicht mit fiktiven Daten: Abbrechen beim Trade-Wechsel und Browser-Zurueck erhaelt den Entwurf; bestaetigter Trade-Wechsel oeffnet den richtigen Editor. Speicherfehler erhaelt den Text, verzogerte Speicherung sperrt den Editor/Seitenwechsel, erfolgreicher Request speichert die richtige Trade-ID und Notiz.
- Desktop 1360 px sowie Mobil 390/320 px in hellem/dunklem Design visuell geprueft; kein horizontaler Seitenueberlauf. Registrierungsroute funktioniert nach Router-Umstellung. Keine aufgezeichneten Konsolenfehler auf den geprueften Demo- und korrigierten Testseiten.
- Direkte native Bestaetigungsdialoge aus synchronen Monats-/Kontoklicks waren ueber die Browsersteuerung nicht durchgaengig automatisierbar. Ihre gemeinsame Entscheidungslogik ist durch Unit-Tests abgedeckt; ein vollstaendiger manueller Browser-Test dieser Dialoge sowie Reload/Tab-Schliessen bleibt sinnvoll.

## Grenzen

Keine echten Konten oder Trades veraendert, keine Mail versendet, keine weitere kostenpflichtige Claude-Anfrage. Das ist kein vollstaendiger Produktions-, Sicherheits- oder Barrierefreiheitstest. Native Reload-Dialoge sind browserabhaengig und garantieren keine Wiederherstellung nach Browserabsturz oder Beenden durch das Betriebssystem.

Strukturierte abgeschlossene Reviews, Abschlussdatum/Zeitzonenmodell, CSV-/Brokerimport und weitere Landingpage-Verbesserungen aus dem Produktreview sind nicht Bestandteil dieses Pakets.

## Isolierte Browser-Testansicht

`scripts/build-review-test.mjs <absoluter Test-Ausgabeordner>` baut `tests/browser/review-test.html` mit echten Review-/Navigationskomponenten, aber lokalen Auth-/PocketBase-Attrappen. Nur ueber einen lokalen HTTP-Server und auf einem anderen Port als die normale Vorschau ausfuehren, nicht per file:// und nicht veroeffentlichen. Der normale Produktions-Build bindet die Testansicht nicht ein.
