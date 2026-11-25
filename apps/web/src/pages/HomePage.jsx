import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowDown, ArrowRight, ArrowUpRight, Plus, Minus, Check, LayoutDashboard, ChartNoAxesCombined, NotebookPen, Target, ListChecks, ScanLine, Sun, Moon, Bot, EyeOff, Images, ShieldCheck, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import DeskSculpture from '@/components/journal/DeskSculpture';
import EdgeFinder from '@/components/journal/EdgeFinder';
import { AccountRulesCard } from '@/components/journal/AccountRules';
import { StatGrid } from '@/components/journal/JournalUI';
import ChallengeSimulator from '@/components/landing/ChallengeSimulator';
import { demoAccounts, demoTrades } from '@/lib/demoData';
import { calculateAdvancedStats } from '@/lib/tradeCalculations';
import { decimal, percent, rValue } from '@/lib/format';

const demoBalances = { [demoAccounts[0].id]: demoAccounts[0].startingBalance };
// A challenge in progress reads better than a finished one: the first eight demo trades, seen on the evening of the last one.
const challengeTrades = demoTrades.slice(0, 8);
const challengeToday = new Date(2026, 6, 13, 18);
const audiences = [
  { id: 'prop', label: 'Prop-Firm / Funded', icon: ShieldCheck, title: 'Bestehen. Und funded bleiben.', copy: 'In einer Challenge entscheidet nicht dein bester Tag, sondern dein schlechtester. Das Journal rechnet deine Limits mit, bevor du die nächste Order aufgibst.', metrics: [
    ['Tagesverlust-Puffer', 'Wie viel Verlust heute noch drin ist und für wie viele volle Verlust-Trades das reicht.'],
    ['Abstand zum maximalen Verlust', 'Statisch oder trailing, mit dem knappsten Abstand, den du bisher hattest.'],
    ['Gewinnziel und Tempo', 'Fortschritt in Prozent und wie viele Handelstage es bei deinem Schnitt noch dauert.'],
    ['Konsistenz', 'Welcher Anteil deines Gewinns von einem einzigen Tag stammt.'],
  ] },
  { id: 'private', label: 'Eigenes Kapital', icon: Wallet, title: 'Kapital schützen. Vorteil belegen.', copy: 'Niemand setzt dir Limits, und genau das ist das Risiko. Lege eigene Regeln fest und prüfe, ob dein Vorteil nach Kosten wirklich existiert.', metrics: [
    ['Erwartungswert in R', 'Was ein Trade im Schnitt bringt, unabhängig von der Positionsgröße.'],
    ['Profitfaktor', 'Gewinne geteilt durch Verluste. Unter 1 verlierst du Geld.'],
    ['Maximaler Rückgang', 'Wie tief es vom Kontohoch nach unten ging und wie gut du es aufgeholt hast.'],
    ['Kostenanteil', 'Wie viel deiner Bruttogewinne an Gebühren geht.'],
  ] },
];

const views = [
  { id: 'overview', label: 'Übersicht', icon: LayoutDashboard, title: 'Alles beginnt mit einem ehrlichen Überblick.', copy: 'Sieh Netto-Ergebnis und Kapitalverlauf in Euro oder Prozent. Woche, Monat oder eigener Zeitraum: Deine Auswertung bleibt nach dem Einstiegsdatum geordnet.', features: ['Euro- und Prozentansicht', 'Handelskalender', 'Gemeinsame Zeitraumfilter'], alt: 'Übersicht mit Netto-Ergebnis, Erwartungswert, Trefferquote und realisiertem Kapitalverlauf', path: '/demo' },
  { id: 'analysis', label: 'Analyse', icon: ChartNoAxesCombined, title: 'Nicht jede grüne Zahl bedeutet einen guten Prozess.', copy: 'Lies Erwartungswert und Median zusammen mit der Ergebnisverteilung. Der Verlauf über 20 oder 50 Trades zeigt Veränderungen; die Risikobasis macht sichtbar, welche Daten in die R-Auswertung eingehen.', features: ['Netto-R und Ergebnisverteilung', 'Gespeichertes oder abgeleitetes Risiko', 'Berechnung und Einordnung erklärt'], alt: 'Analyse mit Median, Netto-R-Verteilung, gleitendem Erwartungswert und R-Abdeckung', path: '/demo/analysis' },
  { id: 'review', label: 'Review', icon: NotebookPen, title: 'Aus einem Rückblick wird dein nächster Schritt.', copy: 'Prüfe Setup und Risiko, ergänze Lern-Tags und halte deine Erkenntnis fest. Speichere einen Entwurf oder schließe den Review mit einem konkreten nächsten Schritt ab.', features: ['Setup- und Risiko-Check', 'Entwurf oder abgeschlossener Review', 'Lern-Tags und Wochenrückblick'], alt: 'Trade-Review mit Regel-Checks, Lern-Tags, Erkenntnis und nächstem Schritt', path: '/demo/review' },
];
const questions = [
  ['Was kann ich aktuell mit dem Journal machen?', 'Du kannst Trades manuell erfassen, mehrere Konten führen, Setups und Symbole analysieren, Monate, Wochen oder eigene Zeiträume auswerten und Reviews als Entwurf speichern oder bewusst abschließen. Dazu kommen Limits für Prop-Firm-Konten, ein Log für nicht genommene Trades, drei Chart-Links je Trade und der Hebel-Finder. Ein CSV-Export enthält alle Trades deiner aktuellen Filterauswahl.'],
  ['Ich trade eine Prop-Firm-Challenge. Was bringt mir das Journal?', 'Du hinterlegst Tagesverlust-Limit, maximalen Verlust (statisch oder trailing), Gewinnziel und eigene Regeln je Konto. Die Übersicht zeigt dir den verbleibenden Puffer, für wie viele volle Verlust-Trades er reicht, deinen Fortschritt zum Ziel und den Anteil deines besten Tages am Gewinn. Grundlage sind deine erfassten, realisierten Trades. Floating-Verluste offener Positionen kennt das Journal nicht.'],
  ['Kann meine KI auf das Journal zugreifen?', 'Ja, wenn du das möchtest. In den Einstellungen erstellst du einen persönlichen Schlüssel, wahlweise nur zum Lesen oder zum Lesen und Erfassen. Damit kann zum Beispiel ChatGPT oder Claude deine Trades samt Chart-Screenshots auswerten und auf Wunsch neue Trades eintragen. Du kannst jeden Schlüssel jederzeit widerrufen. Löschen kann eine KI nichts.'],
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
  const [audience, setAudience] = useState('prop');
  const [scrolled, setScrolled] = useState(false);
  const demoStats = useMemo(() => calculateAdvancedStats(demoTrades, demoAccounts[0].startingBalance, demoBalances, demoBalances), []);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 640);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return <>
    <Helmet><title>The Trading Desk | Dein Trading Journal</title><meta name="description" content="Das deutschsprachige Trading Journal für Risiko, Muster und klare Entscheidungen. Netto-R, Setup-Analyse und strukturierte Reviews. Jetzt kostenlos ausprobieren."/></Helmet>
    <div className="trading-landing">
      <section className="landing-hero" aria-labelledby="landing-title">
        <DeskSculpture appearance="light"/>
        <div className="hero-heading"><p className="landing-eyebrow">Dein deutschsprachiges Trading Journal</p><h1 id="landing-title"><span>The Trading </span><em>Desk.</em></h1></div>
        <span className="hero-study-label">Kurs & Volumen / Illustrative Marktstudie</span>
        <div className="hero-bottom">
          <div className="hero-introduction"><p>Finde heraus, welche Trades dich Geld kosten.<br/><strong>Und wie nah du an deinen Limits bist.</strong></p></div>
          <div className="hero-actions"><div className="hero-buttons"><Button asChild size="lg" className="landing-cta"><Link to="/signup">Kostenlos starten <ArrowRight/></Link></Button><Button asChild size="lg" variant="outline" className="landing-cta landing-cta-secondary"><Link to="/demo">Demo ohne Anmeldung <ArrowUpRight/></Link></Button></div><span className="hero-access">Aktuell kostenfrei · Keine Zahlungsdaten · Für Prop-Firm und eigenes Kapital</span></div>
        </div>
        <Link to="#journal" className="hero-scroll" aria-label="Das Journal kennenlernen"><ArrowDown size={18}/></Link>
      </section>

      <div className="landing-index"><span><ShieldCheck size={18}/><b>Limits im Blick.</b> Tagesverlust, Drawdown, Ziel.</span><span><ChartNoAxesCombined size={18}/><b>Hebel finden.</b> Was kostet, was trägt.</span><span><ListChecks size={18}/><b>Bewusst handeln.</b> Mit einem Prozess.</span></div>

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
        <div className="product-facts"><div><Target/><h3>Ergebnis nach Kosten.</h3><p>Netto-Ergebnis, Kontorendite und Rückgänge aus deinen erfassten Trades.</p></div><div><ScanLine/><h3>Muster mit Kontext.</h3><p>Setups, Symbole und Wochentage vergleichen. Die Stichprobengröße bleibt sichtbar.</p></div><div><NotebookPen/><h3>Ein Review mit Ergebnis.</h3><p>Eine Erkenntnis, ein nächster Schritt. Im Rückblick greifst du beides wieder auf.</p></div><div><Images/><h3>Drei Charts je Trade.</h3><p>Kontext, Validierung und Einstieg als Link. TradingView-Snapshots erscheinen als Vorschau.</p></div><div><EyeOff/><h3>Auch was du nicht handelst.</h3><p>Nicht genommene Setups mit Grund und hypothetischem Ergebnis. Zögern wird messbar.</p></div><div><Bot/><h3>Deine KI liest mit.</h3><p>Per Schlüssel wertet deine KI Trades und Screenshots aus. Nur wenn du es erlaubst.</p></div></div>
      </section>

      <section id="trader" className="landing-audience">
        <div className="landing-section">
          <div className="section-intro"><p className="landing-eyebrow">02 / Für deine Art zu traden</p><h2>Andere Regeln.<br/><em>Andere Kennzahlen.</em></h2><p>Ein Funded-Konto verlierst du an einem schlechten Tag. Eigenes Kapital verlierst du langsam. Das Journal zeigt dir die Zahlen, die für dein Konto zählen.</p></div>
          <Tabs value={audience} onValueChange={setAudience} className="audience-tabs">
            <TabsList aria-label="Kontotyp" className="product-tab-list">{audiences.map(({ id, label, icon: Icon }) => <TabsTrigger value={id} key={id}><Icon size={18}/>{label}</TabsTrigger>)}</TabsList>
            {audiences.map(item => <TabsContent key={item.id} value={item.id} className="audience-panel">
              <div><h3>{item.title}</h3><p>{item.copy}</p><dl>{item.metrics.map(([term, text]) => <div key={term}><dt><Check size={15} aria-hidden="true"/>{term}</dt><dd>{text}</dd></div>)}</dl></div>
              <figure className="light landing-live">{item.id === 'prop'
                ? <AccountRulesCard account={demoAccounts[0]} trades={challengeTrades} today={challengeToday} settingsPath="/signup"/>
                : <section className="journal-panel"><header className="panel-header"><div><p className="panel-eyebrow">Privatkapital · Beispiel</p><h2>Trägt dein Vorteil?</h2></div></header><StatGrid columns={2} items={[
                  { label: 'Erwartungswert', value: rValue(demoStats.expectancyR), tone: 'positive', detail: 'je Trade, nach Kosten' },
                  { label: 'Profitfaktor', value: decimal(demoStats.profitFactor), detail: 'Gewinne ÷ Verluste' },
                  { label: 'Max. Rückgang', value: percent(demoStats.maxDrawdownPct), tone: 'negative', detail: 'vom Kontohoch' },
                  { label: 'Kostenanteil', value: percent(demoStats.totalFees / (demoStats.grossProfit + demoStats.totalFees) * 100), detail: 'der Bruttogewinne' },
                ]}/></section>}
                <figcaption className="product-demo-note">Echte Berechnung aus dem Journal · Fiktive Demodaten</figcaption></figure>
            </TabsContent>)}
          </Tabs>
        </div>
      </section>

      <section id="hebel" className="landing-section landing-edges">
        <div className="section-intro"><p className="landing-eyebrow">03 / Der Hebel-Finder</p><h2>Was kostet dich<br/><em>wirklich Geld?</em></h2><p>Selten ist es die Strategie. Meist sind es wenige wiederkehrende Muster: der dritte Trade am Tag, der Einstieg direkt nach einem Verlust, ein Markt, der dir nicht liegt. Das Journal rechnet dir vor, was jedes Muster gekostet hat.</p></div>
        <figure className="light landing-live"><EdgeFinder trades={demoTrades} balances={demoBalances}/><figcaption className="product-demo-note">So sieht es in deiner Übersicht aus · Fiktive Demodaten</figcaption></figure>
        <div className="edges-cta"><p>Ein Hebel pro Woche reicht. Du brauchst kein neues System, sondern weniger von dem, was nachweislich nicht funktioniert.</p><Button asChild size="lg" className="landing-cta"><Link to="/signup">Meine Hebel finden <ArrowRight/></Link></Button></div>
      </section>

      <section id="simulator" className="landing-sim">
        <div className="landing-section">
          <div className="section-intro"><p className="landing-eyebrow">04 / Challenge-Simulator</p><h2>Reichen deine Zahlen<br/><em>für die Challenge?</em></h2><p>Stell Trefferquote, Gewinngröße und Risiko ein. Das Modell spielt 2.000 mögliche Verläufe durch und zeigt, wie oft dieses Profil das Ziel erreicht, bevor ein Limit reißt.</p></div>
          <ChallengeSimulator/>
        </div>
      </section>

      <section id="methode" className="landing-method">
        <div className="landing-section method-layout">
          <div className="method-title"><p className="landing-eyebrow">05 / Mehr als eine Trefferquote</p><h2>Weniger Bauchgefühl.<br/><em>Mehr Überblick.</em></h2><p>Du brauchst kein weiteres Signal. Du brauchst einen klaren Blick auf das, was du selbst tust.</p><Link className="landing-text-link" to="/demo/analysis">Deine Analyse kennenlernen <ArrowUpRight size={18}/></Link><span className="method-aside">Deine Daten sind der Ausgangspunkt.<br/>Deine Entscheidungen bleiben bei dir.</span></div>
          <div className="method-rows">
            <article><span className="method-number">01</span><div><h3>Was hast du wirklich riskiert?</h3><p>100 € ursprüngliches Risiko und 150 € Gewinn nach Kosten ergeben +1,5 R. Ist keine gültige Risikobasis verfügbar, ist das kein Null-Ergebnis: Der Trade bleibt in der Euro-Auswertung, aber ohne R-Wert.</p><div className="method-equation"><span>Netto-R</span><span>=</span><span className="equation-fraction"><span>Netto-Ergebnis</span><span>Ursprüngliches Risiko</span></span></div></div></article>
            <article><span className="method-number">02</span><div><h3>Was funktioniert wiederholt?</h3><p>Einzelne Ausreißer können den Durchschnitt prägen. Vergleiche deshalb Erwartungswert, Median und Verteilung mit der Anzahl deiner Trades. Historische Ergebnisse sind keine Gewinnprognose.</p><div className="method-tags"><span>Erwartungswert</span><span>Median</span><span>Verteilung</span><span>Stichprobe</span></div></div></article>
            <article><span className="method-number">03</span><div><h3>Was nimmst du mit?</h3><p>Hast du dein Setup und dein geplantes Risiko eingehalten? Halte deine Einschätzung fest. Im Wochenrückblick siehst du Lern-Tags und nächste Schritte aus abgeschlossenen Reviews wieder.</p><div className="method-note"><Check size={16}/><span>Erkenntnis festhalten. Nächsten Schritt bestimmen.</span></div></div></article>
          </div>
        </div>
      </section>

      <section className="landing-access" aria-labelledby="access-title">
        <div className="landing-section access-layout"><div><p className="landing-eyebrow">06 / Raum für deinen eigenen Prozess</p><h2 id="access-title">Der nächste Schritt?<br/><em>Dein eigener Desk.</em></h2></div>
        <div className="access-copy"><span className="access-status"><Check size={16}/> Aktuell kostenfrei</span><p>Fang mit deinem nächsten Trade an.<br/>Und bleib für die Erkenntnisse.</p><Button asChild size="lg" className="landing-cta"><Link to="/signup">Mein Journal starten <ArrowRight/></Link></Button><p className="access-fineprint">Keine Zahlungsdaten. Kein automatisches Abo.<br/>Die Nutzung ist derzeit kostenlos. Falls später kostenpflichtige Angebote hinzukommen, entscheidest du selbst.</p></div></div>
      </section>

      <section id="fragen" className="landing-faq landing-section">
        <div><p className="landing-eyebrow">Ein paar Antworten vorab</p><h2>Gute Fragen.<br/><em>Klare Antworten.</em></h2><p>Was heute möglich ist.<br/>Und was noch nicht dazugehört.</p></div>
        <div>{questions.map(([question, answer], index) => <div key={question} className="faq-row"><h3><button id={'question-' + index} aria-expanded={openQuestion === index} aria-controls={'answer-' + index} onClick={() => setOpenQuestion(openQuestion === index ? null : index)}>{question}{openQuestion === index ? <Minus size={18}/> : <Plus size={18}/>}</button></h3><div id={'answer-' + index} role="region" aria-labelledby={'question-' + index} hidden={openQuestion !== index}><p>{answer}</p></div></div>)}</div>
      </section>
      <div className="landing-signoff landing-section"><Link to="/demo">The Trading <em>Desk.</em><ArrowUpRight aria-hidden="true"/></Link><p>Ein Platz für deine Trades. Und für das, was du daraus lernst.<br/>Keine Anlageberatung. Keine Renditeversprechen.</p></div>
      <div className={'landing-sticky-cta' + (scrolled ? ' is-visible' : '')} aria-hidden={!scrolled}><span>Aktuell kostenfrei</span><Button asChild tabIndex={scrolled ? undefined : -1}><Link to="/signup">Kostenlos starten <ArrowRight/></Link></Button></div>
    </div>
  </>;
}
