import React from 'react';
import {Link} from 'react-router-dom';
export default function Footer(){return <footer className="public-content w-full"><div className="journal-footer"><span>© {new Date().getFullYear()} The Trading Desk</span><nav aria-label="Rechtliches"><Link to="/impressum">Impressum</Link><Link to="/privacy">Datenschutz</Link><Link to="/terms">Nutzungsbedingungen</Link><Link to="/disclaimer">Risikohinweis</Link></nav></div></footer>;}
