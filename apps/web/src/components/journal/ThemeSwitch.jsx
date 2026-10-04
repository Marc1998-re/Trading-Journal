import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { IconButton } from './JournalUI';

export default function ThemeSwitch() {
  const { theme, setTheme, savingTheme } = useTheme();
  return <div className="theme-switch" role="group" aria-label="Farbschema">
    {[['light', 'Helles Design', Sun], ['dark', 'Dunkles Design', Moon]].map(([value, label, Icon]) =>
      <IconButton key={value} label={label} aria-pressed={theme === value} disabled={savingTheme} onClick={() => setTheme(value)}><Icon size={16}/></IconButton>
    )}
  </div>;
}
