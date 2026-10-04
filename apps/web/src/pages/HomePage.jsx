import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowDown, ArrowRight, ArrowUpRight, Plus, Minus, Check, LayoutDashboard, ChartNoAxesCombined, NotebookPen, Target, ListChecks, ScanLine, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import DeskSculpture from '@/components/journal/DeskSculpture';

const views = [
  { id: 'overview', label: 'Übersicht', icon: LayoutDashboard, title: 'Alles beginnt mit einem ehrlichen Überblick.', copy: 'Sieh Netto-Ergebnis und Kapitalverlauf in Euro oder Prozent. Woche, Monat oder eigener Zeitraum: Deine Auswertung bleibt nach dem Einstiegsdatum geordnet.', features: ['Euro- und Prozentansicht', 'Handelskalender', 'Gemeinsame Zeitraumfilter'], alt: 'Übersicht mit Netto-Ergebnis, Erwartungswert, Trefferquote und realisiertem Kapitalverlauf', path: '/demo' },
  { id: 'analysis', label: 'Analyse', icon: ChartNoAxesCombined, title: 'Nicht jede grüne Zahl bedeutet einen guten Prozess.', copy: 'Lies Erwartungswert und Median zusammen mit der Ergebnisverteilung. Der Verlauf über 20 oder 50 Trades zeigt Veränderungen; die Risikobasis macht sichtbar, welche Daten in die R-Auswertung eingehen.', features: ['Netto-R und Ergebnisverteilung', 'Gespeichertes oder abgeleitetes Risiko', 'Berechnung und Einordnung erklärt'], alt: 'Analyse mit Median, Netto-R-Verteilung, gleitendem Erwartungswert und R-Abdeckung', path: '/demo/analysis' },
  { id: 'review', label: 'Review', icon: NotebookPen, title: 'Aus einem Rückblick wird dein nächster Schritt.', copy: 'Prüfe Setup und Risiko, ergänze Lern-Tags und halte deine Erkenntnis fest. Speichere einen Entwurf oder schließe den Review mit einem konkreten nächsten Schritt ab.', features: ['Setup- und Risiko-Check', 'Entwurf oder abgeschlossener Review', 'Lern-Tags und Wochenrückblick'], alt: 'Trade-Review mit Regel-Checks, Lern-Tags, Erkenntnis und nächstem Schritt', path: '/demo/review' },
];
const questions = [
  ['Was kann ich aktuell mit dem Journal machen?', 'Du kannst Trades manuell erfassen, mehrere Konten führen, Setups und Symbole analysieren, Monate, Wochen oder eigene Zeiträume auswerten und Reviews als Entwurf speichern oder bewusst abschließen. Ein CSV-Export enthält alle Trades deiner aktuellen Filterauswahl.'],
  ['Ist The Trading Desk wirklich kostenlos?', 'Ja, aktuell ist die Nutzung kostenfrei. Das kann sich in Zukunft ändern. Mögliche kostenpflichtige Angebote werden vor einer Buchung transparent beschrieben. Deine Registrierung startet kein kostenpflichtiges Abo.'],
  ['Kann ich MT4, MT5 oder meinen Broker verbinden?', 'Noch nicht. Derzeit erfasst du Trades manuell. Auch ein Dateiimport ist noch nicht verfügbar. Du kannst deine erfassten Trades als CSV exportieren; das ist kein automatischer Broker-Abgleich.'],
  ['Was genau wird berechnet?', 'Ausgewertet werden deine erfassten, abgeschlossenen Trades in EUR, nach eingetragenen Kosten und Gewinnbeteiligungen. Netto-R setzt das Ergebnis ins Verhältnis zum ursprünglichen Geldrisiko. Gespeicherte, rekonstruierte, geschätzte und fehlende Risikowerte werden unterschieden. Die Infofelder erklären Berechnung und Bedeutung. Offene Positionen, Ein- und Auszahlungen sowie Fremdwährungsumrechnungen sind nicht enthalten.'],
  ['Nach welchem Datum werden meine Trades ausgewertet?', 'Nach dem Einstiegsdatum. Ein im Januar eröffneter und im Februar geschlossener Trade zählt mit seinem erfassten Ergebnis zum Januar. So vergleichst du deine Einstiege und Setups nach dem gewählten Zeitraum, nicht nach dem Zeitpunkt der Gewinnrealisierung beim Broker.'],
  ['Kann ich das Journal ohne Anmeldung ausprobieren?', 'Ja. Die interaktive Demo zeigt die echte Anwendung mit fiktiven Trades. Du kannst zwischen Übersicht, Journal, Analyse, Verläufen und Review wechseln. Review-Änderungen kannst du in der Demo ausprobieren. Sie bleiben nur während deiner Demo-Sitzung erhalten und werden nicht an den Server gesendet.'],
];

export default function HomePage() {
  const [view, setView] = useState('overview');
  const [previewTheme, setPreviewTheme] = useState('light');
  const [openQuestion, setOpenQuestion] = useState(null);
  return <>
    <Helmet><title>The Trading Desk | Dein Trading Journal</title><meta name="description" content="Das deutschsprachige Trading Journal für Risiko, Muster und klare Entscheidungen. Netto-R, Setup-Analyse und strukturierte Reviews. Jetzt kostenlos ausprobieren."/></Helmet>
    <div className="trading-landing">
      <section className="landing-hero" aria-labelledby="landing-title">
        <DeskSculpture appearance="light"/>
        <div className="hero-heading"><p className="landing-eyebrow">Dein deutschsprachiges Trading Journal</p><h1 id="landing-title"><span>The Trading </span><em>Desk.</em></h1></div>
        <span className="hero-study-label">Kurs & Volumen / Illustrative Marktstudie</span>
        <div className="hero-bottom">
          <div className="hero-introduction"><p>Erfasse Trades. Vergleiche Ergebnis und Risiko.<br/><strong>Halte fest, was du beim nächsten Mal anders machst.</strong></p></div>
          <div className="hero-actions"><Button asChild size="lg" className="landing-cta"><Link to="/demo">Demo öffnen <ArrowUpRight/></Link></Button><span className="hero-access">Ohne Anmeldung ausprobieren · Aktuell kostenfrei</span></div>
        </div>
        <Link to="#journal" className="hero-scroll" aria-label="Das Journal kennenlernen"><ArrowDown size={18}/></Link>
      </section>

      <div className="landing-index"><span><NotebookPen size={18}/><b>Trades festhalten.</b> Mit Kontext.</span><span><ChartNoAxesCombined size={18}/><b>Muster erkennen.</b> Mit deinen Daten.</span><span><ListChecks size={18}/><b>Bewusst handeln.</b> Mit einem Prozess.</span></div>

      <section id="journal" className="landing-product landing-section">
        <div className="section-intro"><p className="landing-eyebrow">01 / Dein persönlicher Trading-Arbeitsplatz</p><h2>Deine Trades.<br/><em>Das ganze Bild.</em></h2><p>Gewinn oder Verlust ist erst der Anfang. Verbinde deine Ergebnisse mit Risiko, Setup und Ausführung. Damit aus einzelnen Trades ein nachvollziehbarer Prozess wird.</p></div>
        <Tabs value={view} onValueChange={setView} className="product-tabs">
          <div className="product-tabs-bar"><TabsList aria-label="Produktansicht" className="product-tab-list">{views.map(({ id, label, icon: Icon }) => <TabsTrigger value={id} key={id}><Icon size={18}/>{label}<ArrowUpRight className="tab-arrow" size={16}/></TabsTrigger>)}</TabsList>
            <TooltipProvider delayDuration={200}><div className="product-theme-switch" role="group" aria-label="Farbschema der Produktvorschau">{[['light', Sun, 'Helle Produktvorschau'], ['dark', Moon, 'Dunkle Produktvorschau']].map(([value, Icon, label]) => <Tooltip key={value}><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" aria-label={label} aria-pressed={previewTheme === value} onClick={() => setPreviewTheme(value)}><Icon size={17}/></Button></TooltipTrigger><TooltipContent>{label}</TooltipContent></Tooltip>)}</div></TooltipProvider>
          </div>
          {views.map(item => <TabsContent key={item.id} value={item.id} className="product-panel">
            <div className="product-caption"><h3>{item.title}</h3><Link to={item.path} className="landing-text-link">Demo öffnen <ArrowUpRight size={17}/></Link></div>
            <figure>
              <Link to={item.path} className="product-screen" data-preview-theme={previewTheme} aria-label={item.label + ' in der interaktiven Demo öffnen'}><picture>
                <source media="(max-width: 767px)" srcSet={`/assets/product-${item.id}-${previewTheme}-mobile.webp`} width="390" height="844"/>
                <img src={`/assets/product-${item.id}-${previewTheme}-desktop.webp`} width="1425" height="990" loading="lazy" decoding="async" alt={`The Trading Desk: ${item.alt}. Fiktive Demodaten, ${previewTheme === 'light' ? 'helles' : 'dunkles'} Design.`}/>
              </picture></Link>
              <figcaption className="product-demo-note">Aktuelle Anwendung · Fiktive Demodaten · August 2026</figcaption>
            </figure>
            <div className="product-summary"><p className="product-context">{item.copy}</p><ul className="product-feature-list">{item.features.map(feature => <li key={feature}><Check size={15} aria-hidden="true"/>{feature}</li>)}</ul></div>
          </TabsContent>)}
        </Tabs>
        <div className="product-facts"><div><Target/><h3>Ergebnis nach Kosten.</h3><p>Netto-Ergebnis, Kontorendite und Rückgänge aus deinen erfassten Trades.</p></div><div><ScanLine/><h3>Muster mit Kontext.</h3><p>Setups, Symbole und Wochentage vergleichen. Die Stichprobengröße bleibt sichtbar.</p></div><div><NotebookPen/><h3>Ein Review mit Ergebnis.</h3><p>Eine Erkenntnis, ein nächster Schritt. Im Rückblick greifst du beides wieder auf.</p></div></div>
      </section>

      <section id="methode" className="landing-method">
        <div className="landing-section method-layout">
          <div className="method-title"><p className="landing-eyebrow">02 / Mehr als eine Trefferquote</p><h2>Weniger Bauchgefühl.<br/><em>Mehr Überblick.</em></h2><p>Du brauchst kein weiteres Signal. Du brauchst einen klaren Blick auf das, was du selbst tust.</p><Link className="landing-text-link" to="/demo/analysis">Deine Analyse kennenlernen <ArrowUpRight size={18}/></Link><span className="method-aside">Deine Daten sind der Ausgangspunkt.<br/>Deine Entscheidungen bleiben bei dir.</span></div>
          <div className="method-rows">
            <article><span className="method-number">01</span><div><h3>Was hast du wirklich riskiert?</h3><p>100 € ursprüngliches Risiko und 150 € Gewinn nach Kosten ergeben +1,5 R. Ist keine gültige Risikobasis verfügbar, ist das kein Null-Ergebnis: Der Trade bleibt in der Euro-Auswertung, aber ohne R-Wert.</p><div className="method-equation"><span>Netto-R</span><span>=</span><span className="equation-fraction"><span>Netto-Ergebnis</span><span>Ursprüngliches Risiko</span></span></div></div></article>
            <article><span className="method-number">02</span><div><h3>Was funktioniert wiederholt?</h3><p>Einzelne Ausreißer können den Durchschnitt prägen. Vergleiche deshalb Erwartungswert, Median und Verteilung mit der Anzahl deiner Trades. Historische Ergebnisse sind keine Gewinnprognose.</p><div className="method-tags"><span>Erwartungswert</span><span>Median</span><span>Verteilung</span><span>Stichprobe</span></div></div></article>
            <article><span className="method-number">03</span><div><h3>Was nimmst du mit?</h3><p>Hast du dein Setup und dein geplantes Risiko eingehalten? Halte deine Einschätzung fest. Im Wochenrückblick siehst du Lern-Tags und nächste Schritte aus abgeschlossenen Reviews wieder.</p><div className="method-note"><Check size={16}/><span>Erkenntnis festhalten. Nächsten Schritt bestimmen.</span></div></div></article>
          </div>
        </div>
      </section>

      <section className="landing-access" aria-labelledby="access-title">
        <div className="landing-section access-layout"><div><p className="landing-eyebrow">03 / Raum für deinen eigenen Prozess</p><h2 id="access-title">Der nächste Schritt?<br/><em>Dein eigener Desk.</em></h2></div>
        <div className="access-copy"><span className="access-status"><Check size={16}/> Aktuell kostenfrei</span><p>Fang mit deinem nächsten Trade an.<br/>Und bleib für die Erkenntnisse.</p><Button asChild size="lg" className="landing-cta"><Link to="/signup">Mein Journal starten <ArrowRight/></Link></Button><p className="access-fineprint">Keine Zahlungsdaten. Kein automatisches Abo.<br/>Die Nutzung ist derzeit kostenlos. Falls später kostenpflichtige Angebote hinzukommen, entscheidest du selbst.</p></div></div>
      </section>

      <section id="fragen" className="landing-faq landing-section">
        <div><p className="landing-eyebrow">Ein paar Antworten vorab</p><h2>Gute Fragen.<br/><em>Klare Antworten.</em></h2><p>Was heute möglich ist.<br/>Und was noch nicht dazugehört.</p></div>
        <div>{questions.map(([question, answer], index) => <div key={question} className="faq-row"><h3><button id={'question-' + index} aria-expanded={openQuestion === index} aria-controls={'answer-' + index} onClick={() => setOpenQuestion(openQuestion === index ? null : index)}>{question}{openQuestion === index ? <Minus size={18}/> : <Plus size={18}/>}</button></h3><div id={'answer-' + index} role="region" aria-labelledby={'question-' + index} hidden={openQuestion !== index}><p>{answer}</p></div></div>)}</div>
      </section>
      <div className="landing-signoff landing-section"><Link to="/demo">The Trading <em>Desk.</em><ArrowUpRight aria-hidden="true"/></Link><p>Ein Platz für deine Trades. Und für das, was du daraus lernst.<br/>Keine Anlageberatung. Keine Renditeversprechen.</p></div>
    </div>
  </>;
}
