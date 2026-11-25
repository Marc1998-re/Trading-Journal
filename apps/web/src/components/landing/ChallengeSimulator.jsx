import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { challengePresets, simulateChallenge } from '@/lib/challengeSim';
import { decimal, percent, rValue } from '@/lib/format';

const controls = [
  ['winRate', 'Trefferquote', 20, 80, 1, v => `${v} %`],
  ['reward', 'Ø Gewinn je Gewinner', 0.5, 4, 0.1, v => `${decimal(v, 1)} R`],
  ['riskPct', 'Risiko je Trade', 0.25, 3, 0.25, v => `${decimal(v, 2)} %`],
  ['tradesPerDay', 'Trades pro Tag', 1, 6, 1, v => String(v)],
];

/** Interactive model: how likely does a given trading profile pass a prop-firm evaluation? */
export default function ChallengeSimulator() {
  const [preset, setPreset] = useState(challengePresets[0]);
  const [input, setInput] = useState({ winRate: 40, reward: 2, riskPct: 2, tradesPerDay: 3 });
  const result = useMemo(() => simulateChallenge({ ...input, ...preset }), [input, preset]);
  const halfRisk = Math.max(0.25, input.riskPct / 2);
  const calmer = useMemo(() => halfRisk < input.riskPct ? simulateChallenge({ ...input, ...preset, riskPct: halfRisk }) : null, [input, preset, halfRisk]);
  const parts = [
    ['Bestanden', result.passRate, 'bg-success'], ['Tageslimit gerissen', result.failDailyRate, 'bg-warning'],
    ['Max. Verlust gerissen', result.failMaxRate, 'bg-destructive'], ['Nach 60 Tagen offen', result.openRate, 'bg-muted-foreground'],
  ];
  const verdict = result.expectancyR <= 0 ? 'Ohne positiven Erwartungswert hilft auch die beste Risikosteuerung nicht. Erst den Vorteil finden, dann die Challenge buchen.'
    : calmer && calmer.passRate > result.passRate + 2 ? `Mit ${decimal(halfRisk, 2)} % statt ${decimal(input.riskPct, 2)} % Risiko steigt die Quote in diesem Modell auf ${percent(calmer.passRate, { digits: 0 })}. Weniger Risiko ist hier der größte Hebel.`
    : result.passRate >= 70 ? 'Mit diesen Werten ist die Challenge vor allem eine Frage der Geduld. Entscheidend ist, ob deine echten Zahlen so aussehen.'
    : 'Trefferquote und Gewinngröße tragen das Profil nur knapp. Schon wenige Regelbrüche kippen das Ergebnis.';
  return <div className="sim">
    <div className="sim-controls">
      <div className="sim-presets" role="group" aria-label="Challenge-Regeln">{challengePresets.map(p => <button type="button" key={p.key} aria-pressed={preset.key === p.key} onClick={() => setPreset(p)}>{p.label}</button>)}</div>
      <p className="sim-rules">Ziel {preset.target} % · Tagesverlust {preset.dailyLimit} % · Max. Verlust {preset.maxLoss} % (statisch)</p>
      {controls.map(([key, label, min, max, step, format]) => <div key={key} className="sim-control">
        <div><label id={'sim-' + key}>{label}</label><output>{format(input[key])}</output></div>
        <Slider aria-labelledby={'sim-' + key} min={min} max={max} step={step} value={[input[key]]} onValueChange={([value]) => setInput(current => ({ ...current, [key]: value }))} />
      </div>)}
    </div>
    <div className="sim-result" aria-live="polite">
      <p className="sim-label">Bestanden in diesem Modell</p>
      <p className={'sim-rate ' + (result.passRate >= 60 ? 'text-success' : result.passRate >= 30 ? 'text-warning' : 'text-destructive')}>{percent(result.passRate, { digits: 0 })}</p>
      <div className="sim-bar" aria-hidden="true">{parts.map(([label, value, tone]) => <i key={label} className={tone} style={{ width: value + '%' }} />)}</div>
      <ul className="sim-legend">{parts.map(([label, value, tone]) => <li key={label}><i className={tone} />{label}<b>{percent(value, { digits: 0 })}</b></li>)}</ul>
      <dl className="sim-facts">
        <div><dt>Erwartungswert</dt><dd className={result.expectancyR > 0 ? 'text-success' : 'text-destructive'}>{rValue(result.expectancyR)} je Trade</dd></div>
        <div><dt>Handelstage bis zum Ziel</dt><dd>{result.medianDays ? `${result.medianDays} (Median)` : '—'}</dd></div>
        <div><dt>Verluste in Folge bis Tageslimit</dt><dd>{result.lossesToDailyLimit}</dd></div>
      </dl>
      <p className="sim-verdict">{verdict}</p>
      <Button asChild size="lg" className="landing-cta"><Link to="/signup">Mit meinen echten Zahlen prüfen <ArrowRight /></Link></Button>
      <p className="sim-note">Rechenmodell mit 2.000 Zufallsverläufen und gleichbleibenden Annahmen. Ohne Gebühren, Trailing-Drawdown und Floating-Verluste. Keine Prognose und keine Zusage, dass du eine Challenge bestehst.</p>
    </div>
  </div>;
}
