import React from 'react';
import { createRoot } from 'react-dom/client';
import DeskSculpture from './components/journal/DeskSculpture';
import './index.css';

// Development-only stage for generating the static WebGL fallback assets.
if (import.meta.env.DEV) {
  const daylight = new URLSearchParams(window.location.search).get('appearance') === 'light';
  createRoot(document.getElementById('root')).render(<div className={daylight ? 'landing-theme market-capture-light' : ''} style={{ position: 'relative', width: '100%', height: '100svh', overflow: 'hidden' }}><DeskSculpture capture appearance={daylight ? 'light' : 'dark'}/></div>);
}
