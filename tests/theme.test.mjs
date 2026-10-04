import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import postcss from 'postcss';

const stylesheet = postcss.parse(readFileSync(new URL('../apps/web/src/index.css', import.meta.url), 'utf8'));
function tokens(selector) {
  const result = {};
  stylesheet.walkRules(selector, rule => rule.walkDecls(/^--/, declaration => {
    result[declaration.prop] = declaration.value;
  }));
  return result;
}
const dark = tokens(':root, .dark');
const light = tokens('.light');

test('the original dark palette is preserved', () => {
  assert.deepEqual(dark, {
    '--background': '220 15% 5%', '--foreground': '210 40% 98%',
    '--card': '220 13% 8%', '--card-foreground': '210 40% 98%',
    '--popover': '220 13% 10%', '--popover-foreground': '210 40% 98%',
    '--primary': '198 87% 58%', '--primary-foreground': '210 30% 8%',
    '--secondary': '220 13% 14%', '--secondary-foreground': '210 40% 98%',
    '--muted': '220 13% 14%', '--muted-foreground': '215 12% 65%',
    '--accent': '39 92% 58%', '--accent-foreground': '30 42% 10%',
    '--destructive': '352 81% 58%', '--destructive-foreground': '42 36% 94%',
    '--success': '151 78% 45%', '--success-foreground': '210 30% 8%',
    '--info': '198 87% 58%', '--info-foreground': '210 30% 8%',
    '--border': '220 13% 20%', '--input': '220 13% 20%', '--ring': '198 87% 58%',
    '--radius': '0.375rem', '--chart-green': '151 78% 45%',
    '--chart-red': '352 81% 58%', '--chart-gray': '42 13% 67%',
  });
});

test('light mode defines every semantic color, including portal and chart colors', () => {
  assert.deepEqual(Object.keys(light).sort(), Object.keys(dark).filter(key => key !== '--radius').sort());
  assert.equal(light['--primary'], '166 55% 29%');
  assert.equal(light['--accent'], '51 91% 78%');
});

function luminance(hsl) {
  const [hue, saturation, lightness] = hsl.split(' ').map(parseFloat);
  const s = saturation / 100, l = lightness / 100;
  const a = s * Math.min(l, 1 - l);
  const rgb = [0, 8, 4].map(n => {
    const k = (n + hue / 30) % 12;
    const v = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test('light mode body, financial values and button labels meet AA text contrast', () => {
  for (const foreground of ['foreground', 'muted-foreground', 'success', 'destructive']) {
    for (const background of ['background', 'card', 'secondary']) {
      assert.ok(contrast(light['--' + foreground], light['--' + background]) >= 4.5, `${foreground} on ${background}`);
    }
  }
  for (const role of ['primary', 'accent', 'destructive', 'popover']) {
    assert.ok(contrast(light['--' + role], light['--' + role + '-foreground']) >= 4.5, role);
  }
});
