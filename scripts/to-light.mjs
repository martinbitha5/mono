// Conversion thème sombre → thème clair (style Hostinger)
// Passe unique : toutes les substitutions sont simultanées (pas de cascade).
import { readFileSync, writeFileSync } from 'node:fs';


const files = process.argv.slice(2);

// ── Mappings exacts (triés du plus long au plus court à l'exécution) ──
const EXACT = {
  // Fonds de page
  'bg-[#0A0A0B]': 'bg-[#F4F5FA]',
  'bg-[#09090B]': 'bg-[#F4F5FA]',
  'bg-[#09090b]': 'bg-[#F4F5FA]',
  'bg-[#0B0B0D]': 'bg-[#F4F5FA]',
  'bg-zinc-950': 'bg-[#F4F5FA]',
  // Panneaux / cards
  'bg-[#0C0C0E]': 'bg-white',
  'bg-[#0D0D0F]': 'bg-white',
  'bg-[#0E0E10]': 'bg-white',
  'bg-[#0F0F12]': 'bg-white',
  'bg-zinc-900/90': 'bg-white',
  'bg-zinc-900/80': 'bg-white',
  'bg-zinc-900/70': 'bg-white',
  'bg-zinc-900/60': 'bg-white',
  'bg-zinc-900/50': 'bg-white',
  'bg-zinc-900/40': 'bg-white',
  'bg-zinc-900': 'bg-white',
  'bg-zinc-800/80': 'bg-[#F0F1F7]',
  'bg-zinc-800/60': 'bg-[#F0F1F7]',
  'bg-zinc-800/50': 'bg-[#F0F1F7]',
  'bg-zinc-800/40': 'bg-[#F4F5FA]',
  'bg-zinc-800/30': 'bg-[#F4F5FA]',
  'bg-zinc-800': 'bg-[#EEF0F7]',
  'bg-zinc-700/50': 'bg-[#E6E8F0]',
  'bg-zinc-700': 'bg-[#E6E8F0]',
  // Fills noirs translucides (petits badges, chips)
  'bg-black/40': 'bg-[#F0F1F7]',
  'bg-black/30': 'bg-[#F4F5FA]',
  'bg-black/25': 'bg-[#F4F5FA]',
  'bg-black/20': 'bg-[#F4F5FA]',
  // Texte
  'text-zinc-50': 'text-zinc-900',
  'text-zinc-100': 'text-zinc-900',
  'text-zinc-200': 'text-zinc-800',
  'text-zinc-300': 'text-zinc-700',
  'text-zinc-400': 'text-zinc-500',
  'text-zinc-600': 'text-zinc-400',
  'text-zinc-700': 'text-zinc-300',
  'text-zinc-800': 'text-zinc-200',
  // Bordures zinc
  'border-zinc-800': 'border-[#E6E8F0]',
  'border-zinc-700': 'border-[#D8DBE8]',
  'border-zinc-600': 'border-[#C9CDDE]',
  'divide-zinc-800': 'divide-[#EEF0F6]',
  'divide-zinc-700': 'divide-[#E6E8F0]',
};

// Accents : text-X-300/400 → 700/600 (contraste sur fond clair)
const COLORS = 'red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const REGEX_RULES = [
  // Bordures blanches translucides → bordure grise claire
  [new RegExp(String.raw`border-white/\[0\.\d+\]`, 'g'), 'border-[#E6E8F0]'],
  [new RegExp(String.raw`divide-white/\[0\.\d+\]`, 'g'), 'divide-[#EEF0F6]'],
  [new RegExp(String.raw`ring-white/\[0\.\d+\]`, 'g'), 'ring-[#E6E8F0]'],
  // Fills blancs translucides
  [new RegExp(String.raw`bg-white/\[0\.0[123]\d*\]`, 'g'), 'bg-[#FAFBFE]'],
  [new RegExp(String.raw`bg-white/\[0\.0[456]\d*\]`, 'g'), 'bg-[#F4F5FA]'],
  [new RegExp(String.raw`bg-white/\[0\.(0[789]|1\d?)\d*\]`, 'g'), 'bg-[#E6E8F0]'],
  [new RegExp(String.raw`bg-white/5\b`, 'g'), 'bg-[#F4F5FA]'],
  [new RegExp(String.raw`bg-white/10\b`, 'g'), 'bg-[#E6E8F0]'],
  // Texte accent
  [new RegExp(`text-(${COLORS})-300\\b`, 'g'), 'text-$1-700'],
  [new RegExp(`text-(${COLORS})-400\\b`, 'g'), 'text-$1-600'],
  // Fonds accent translucides → pastels
  [new RegExp(`bg-(${COLORS})-[456]00/(?:5|10|15|\\[0\\.0\\d+\\])`, 'g'), 'bg-$1-50'],
  [new RegExp(`bg-(${COLORS})-[456]00/(?:20|25|30|\\[0\\.[123]\\d*\\])`, 'g'), 'bg-$1-100'],
  // Bordures accent translucides
  [new RegExp(`border-(${COLORS})-[456]00/(?:\\d+|\\[0\\.\\d+\\])`, 'g'), 'border-$1-200'],
];

// Construit une regex unique pour les mappings exacts (longest-first)
const exactKeys = Object.keys(EXACT).sort((a, b) => b.length - a.length);
const exactRe = new RegExp(exactKeys.map(k => k.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')).join('|'), 'g');

let totalChanges = 0;
for (const f of files) {
  let src = readFileSync(f, 'utf8');
  const before = src;
  src = src.replace(exactRe, m => EXACT[m]);
  for (const [re, rep] of REGEX_RULES) src = src.replace(re, rep);
  if (src !== before) {
    writeFileSync(f, src, 'utf8');
    const n = [...before].length; // crude
    console.log(`✓ ${f}`);
    totalChanges++;
  } else {
    console.log(`· ${f} (inchangé)`);
  }
}
console.log(`\n${totalChanges} fichier(s) modifié(s)`);
