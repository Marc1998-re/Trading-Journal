import React from 'react';
import MetricHelp from './MetricHelp';
import { riskSources } from '@/lib/riskAnalysis';

export default function RiskBasisLabel({ source }) {
  const info = riskSources[source] || riskSources.missing;
  return <MetricHelp helpKey={`risk_${riskSources[source] ? source : 'missing'}`} label={`Risikobasis: ${info.label}`} triggerText={info.label}/>;
}
