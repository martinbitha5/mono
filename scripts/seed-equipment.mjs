// Insertion de l'inventaire informatique ATS — septembre 2025
// Source : INVENTAIRE INFORMATIQUE SEPTEMBRE 2025.xlsx
// Site : Kinshasa (Aéroport N'Djili + Administration Ville)

const URL  = 'https://xdtouksritcbhphhmefi.supabase.co';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkdG91a3NyaXRjYmhwaGhtZWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2ODM3MDEsImV4cCI6MjA5MjI1OTcwMX0.vHFF6VDsppWsvLnXQTmjESGIFK5RAZW3mWF90px8Xxc';

// helper : nom affiché = designation si dispo, sinon marque
const n = (marque, designation) => designation ? `${designation} — ${marque}` : marque;

const EQUIPMENT = [
  // ══════════════════════════════════════════════════════════════════
  // AÉROPORT N'DJILI — postes CSI / OPS / FIH / ESCALE
  // ══════════════════════════════════════════════════════════════════
  {
    name: n('Lenovo', 'CSI-ATS 0003'),
    marque: 'LENOVO', serial_number: 'R90VS4XT', designation: 'CSI-ATS 0003',
    description: 'Intel® CPU 1,80 Ghz, 4Go RAM, 1 To HDD',
    adresse_mac: 'DC-71-96-0D-D2-7F', affectation: 'IT/Logistique',
    notes: 'Utilisateur : LOUISON — ID OEM : 00001-AA323',
    proprietaire: 'ATS', type: 'IT', status: 'functional', availability: 'assigned', site: 'Kinshasa',
  },
  {
    name: n('Dell', 'CSI-ATS 0001'),
    marque: 'DELL', serial_number: null, designation: 'CSI-ATS 0001',
    description: 'AMD Ryzen CPU 3,30 Ghz, 16Go RAM, 1 To HDD',
    adresse_mac: '3C-0A-F3-A9-62-CD', affectation: 'IT/Département',
    notes: 'Utilisateur : PAPPUIS — ID OEM : 22438-AAOEM',
    proprietaire: 'ATS', type: 'IT', status: 'functional', availability: 'assigned', site: 'Kinshasa',
  },
  {
    name: n('Dell', 'CSI-ATS 0002'),
    marque: 'DELL', serial_number: null, designation: 'CSI-ATS 0002',
    description: 'Intel® i7 CPU 2,60 Ghz, 16Go RAM, 238 Go HDD',
    adresse_mac: 'C8-F7-50-2F-FB-98', affectation: 'IT/Développement',
    notes: 'Utilisateur : MARTIN — ID OEM : 91307-AAOEM',
    proprietaire: 'ATS', type: 'IT', status: 'functional', availability: 'assigned', site: 'Kinshasa',
  },
  {
    name: n('Lenovo', 'OPS 0004'),
    marque: 'LENOVO', serial_number: null, designation: 'OPS 0004',
    description: '13th Gen Intel® Core™ i7 2,40 Ghz, 16Go RAM, 500 Go HDD',
    adresse_mac: '40-C2-BA-6A-56-98', affectation: 'IT/OPS',
    notes: 'Utilisateur : POSTE/1 — ID OEM : 00001-AA175',
    proprietaire: 'ATS', type: 'IT', status: 'functional', availability: 'assigned', site: 'Kinshasa',
  },
  {
    name: n('HP', 'OPS2'),
    marque: 'HP LE1901w', serial_number: null, designation: 'OPS2',
    description: 'Pentium® Dual-Core CPU 3,00Ghz, 6Go RAM, 300 Go HDD',
    adresse_mac: '44-37-E6-44-09-43', affectation: 'IT/OPS',
    notes: 'Utilisateur : POSTE/2 — Non disponible (ID)',
    proprietaire: 'ATS', type: 'IT', status: 'functional', availability: 'assigned', site: 'Kinshasa',
  },
  {
    name: n('HP', 'ATS-OPS1'),
    marque: 'HP', serial_number: null, designation: 'ATS-OPS1',
    description: 'Intel® Celeron® 2,00Ghz, 8Go RAM, 477 Go HDD',
    adresse_mac: 'D4-61-37-02-9F-A7', affectation: 'IT/OPS',
    notes: 'Utilisateur : POSTE/3 — ID OEM : 46187-AAOEM',
    proprietaire: 'ATS', type: 'IT', status: 'functional', availability: 'assigned', site: 'Kinshasa',
  },
  {
    name: n('HP', 'ATS0725-03'),
    marque: 'HP', serial_number: '1H852655CX', designation: 'ATS0725-03',
    description: '13th Gen Intel(R) Core™ i3 1,20 Ghz, 8 Go RAM, 238 Go HDD',
    adresse_mac: 'F8-3D-C6-74-25-38', affectation: 'IT/Business',
    notes: 'Utilisateur : PASSAGES — ID OEM : 41840-AAOEM',
    proprietaire: 'ATS', type: 'IT', status: 'functional', availability: 'assigned', site: 'Kinshasa',
  },
  {
    name: n('HP', 'ATS-FIH1'),
    marque: 'HP', serial_number: 'MZ00WL4P', designation: 'ATS-FIH1',
    description: 'Intel® Core™ i5 2,50Ghz, 8Go RAM, 238 Go HDD',
    adresse_mac: 'E8-B0-C5-B7-7D-F2', affectation: 'IT/Comptoire 1a',
    notes: 'Utilisateur : PASSAGES — ID OEM : 56434-AAOEM',
    proprietaire: 'ATS', type: 'IT', status: 'functional', availability: 'assigned', site: 'Kinshasa',
  },
  {
    name: n('HP', 'PCMBSA02 — Comptoire 1b'),
    marque: 'HP', serial_number: 'CZC4397WK7', designation: 'PCMBSA02',
    description: '12th Gen Intel® Core™ i5 3Ghz, 16Go RAM, 1.14 TB HDD',
    adresse_mac: 'E0-8F-4C-5A-5D-57', affectation: 'IT/Comptoire 1b',
    notes: 'Utilisateur : PASSAGES — ID OEM : 79159-AAOEM',
    proprietaire: 'ATS', type: 'IT', status: 'functional', availability: 'assigned', site: 'Kinshasa',
  },
  {
    name: n('HP', 'PCMBSA02 — Comptoire 2a'),
    marque: 'HP', serial_number: 'CZC4397WK0', designation: 'PCMBSA02',
    description: '12th Gen Intel® Core™ i5 3Ghz, 16Go RAM, 1.16 TB HDD',
    adresse_mac: '28-C5-C8-80-59-F4', affectation: 'IT/Comptoire 2a',
    notes: 'Utilisateur : PASSAGES — ID OEM : 79093-AAOEM',
    proprietaire: 'ATS', type: 'IT', status: 'functional', availability: 'assigned', site: 'Kinshasa',
  },
  {
    name: n('HP', 'ATS-FIH2'),
    marque: 'HP', serial_number: null, designation: 'ATS-FIH2',
    description: 'Intel® Core™ i5 2,50Ghz, 8Go RAM, 236 Go HDD',
    adresse_mac: 'D0-F4-05-33-81-40', affectation: 'IT/Comptoire 2b',
    notes: 'Utilisateur : PASSAGES — ID OEM : 53501-AAOEM',
    proprietaire: 'ATS', type: 'IT', status: 'functional', availability: 'assigned', site: 'Kinshasa',
  },
  {
    name: n('HP', 'ATS 007'),
    marque: 'HP', serial_number: null, designation: 'ATS 007',
    description: '13th Gen Intel(R) Core™ i3 1,20 Ghz, 8 Go RAM, 238 Go HDD',
    adresse_mac: 'F8-3D-C6-73-C8-A4', affectation: 'IT/ESCALE',
    notes: 'Utilisateur : RUBIN — ID OEM : 41986-AAOEM',
    proprietaire: 'ATS', type: 'IT', status: 'functional', availability: 'assigned', site: 'Kinshasa',
  },
  {
    name: n('HP', 'ATS — ESCALE'),
    marque: 'HP', serial_number: '5CD61073SM', designation: 'ATS',
    description: 'AMD A8-7410 APU, 2,20 Ghz, 4 Go RAM',
    adresse_mac: 'A8-A7-95-83-7A-87', affectation: 'IT/SCALE',
    notes: 'Utilisateur : MARCELINE',
    proprietaire: 'ATS', type: 'IT', status: 'functional', availability: 'assigned', site: 'Kinshasa',
  },
  // ── Laptops N'Djili / partagés ────────────────────────────────────────────
  {
    name: n('Dell Laptop', 'WINTERFELL'),
    marque: 'DELL - LAPTOP', serial_number: null, designation: 'WINTERFELL',
    description: '13th Gen Intel Core i7-1355U, 16,0 Go RAM, 1 To HDD',
    adresse_mac: 'BC-03-58-39-BB-78', affectation: 'IT',
    notes: 'Utilisateur : ARISTARQUE',
    proprietaire: 'ARISTARQUE', type: 'IT', status: 'functional', availability: 'assigned', site: 'Kinshasa',
  },
  {
    name: n('HP Laptop', 'ATS0725-07'),
    marque: 'HP - LAPTOP', serial_number: null, designation: 'ATS0725-07',
    description: '13th Gen Intel Core i3-1315, 8GB RAM, HDD 256 Go',
    adresse_mac: 'F8-3D-C6-72-B0-B9', affectation: null,
    notes: 'Non affecté',
    proprietaire: 'ATS', type: 'IT', status: 'functional', availability: 'available', site: 'Kinshasa',
  },
  {
    name: 'HP Laptop — Secrétariat',
    marque: 'HP - LAPTOP', serial_number: null, designation: null,
    description: null, adresse_mac: null, affectation: 'SECRETARIAT',
    notes: 'Utilisateur : NAOMIE',
    proprietaire: 'ATS', type: 'IT', status: 'functional', availability: 'assigned', site: 'Kinshasa',
  },
  {
    name: 'Lenovo Chromebook — IT',
    marque: 'LENOVO CHROMEBOOK - LAPTOP', serial_number: null, designation: null,
    description: null, adresse_mac: null, affectation: 'IT',
    notes: 'Utilisateur : ARISTARQUE',
    proprietaire: 'ATS', type: 'IT', status: 'functional', availability: 'assigned', site: 'Kinshasa',
  },
  {
    name: n('Asus VivoBook', 'LAPTOP-ATS-SG-00'),
    marque: 'ASUS VIVOBOOK - LAPTOP', serial_number: null, designation: 'LAPTOP-ATS-SG-00',
    description: 'Core i5, 16 Go RAM, 1 To HDD',
    adresse_mac: null, affectation: 'IT',
    notes: 'Utilisateur : GINO NGIMBI',
    proprietaire: 'ATS', type: 'IT', status: 'functional', availability: 'assigned', site: 'Kinshasa',
  },
  // ── Laptops Admin Ville — RH / Sec Général ───────────────────────────────
  {
    name: n('HP Laptop', 'LAPTOP-ATS-RH-00'),
    marque: 'HP - LAPTOP', serial_number: null, designation: 'LAPTOP-ATS-RH-00',
    description: 'AMD Ryzen, 8 Go RAM, 256 Go HDD',
    adresse_mac: '5C-FB-3A-9C-52-0E', affectation: 'RH',
    notes: 'Utilisateur : MICHEL KITENGE — Admin Ville',
    proprietaire: 'ATS', type: 'IT', status: 'functional', availability: 'assigned', site: 'Kinshasa',
  },
  {
    name: n('Asus VivoBook', 'LAPTOP-ATS-SG-00 — Sec Gén'),
    marque: 'ASUS VIVOBOOK - LAPTOP', serial_number: null, designation: 'LAPTOP-ATS-SG-00',
    description: '12th Gen Intel Core i5, 16 Go RAM, HDD 500 Go',
    adresse_mac: '4C-B0-42-26-A2-07', affectation: 'SECRETARIAT GÉNÉRAL',
    notes: 'Utilisateur : PAULIN KEKUMBA — Admin Ville',
    proprietaire: 'ATS', type: 'IT', status: 'functional', availability: 'assigned', site: 'Kinshasa',
  },
  // ── Desktops Comptabilité / Trésorerie ───────────────────────────────────
  {
    name: 'Lenovo Desktop — Comptabilité',
    marque: 'LENOVO - DESKTOP', serial_number: null, designation: null,
    description: 'Core i3, 8Go RAM, 256 Go HDD',
    adresse_mac: null, affectation: 'COMPTABILITE',
    notes: 'Utilisateur : ABEL DIAKESE',
    proprietaire: 'ATS', type: 'IT', status: 'functional', availability: 'assigned', site: 'Kinshasa',
  },
  {
    name: n('Lenovo Desktop', 'ATSCOMPTA-03'),
    marque: 'LENOVO - DESKTOP', serial_number: null, designation: 'ATSCOMPTA-03',
    description: 'Core i5, 8Go RAM, 256 Go HDD',
    adresse_mac: 'B8-1E-A4-7B-34-1A', affectation: 'COMPTABILITE',
    notes: 'Utilisateur : ELYSA BASUBI',
    proprietaire: 'ATS', type: 'IT', status: 'functional', availability: 'assigned', site: 'Kinshasa',
  },
  {
    name: n('Lenovo Desktop', 'ATSCOMPTA-04'),
    marque: 'LENOVO - DESKTOP', serial_number: null, designation: 'ATSCOMPTA-04',
    description: 'Core i3, 8Go RAM, 256 Go HDD',
    adresse_mac: 'E8-B0-C5-4F-7B-BB', affectation: 'COMPTABILITE',
    notes: 'Utilisateur : BIJOU OPOWA',
    proprietaire: 'ATS', type: 'IT', status: 'functional', availability: 'assigned', site: 'Kinshasa',
  },
  {
    name: n('Lenovo Desktop', 'ATSCOMPTA1'),
    marque: 'LENOVO - DESKTOP', serial_number: null, designation: 'ATSCOMPTA1',
    description: 'Core i5, 8 Go RAM, 256 Go HDD',
    adresse_mac: 'EA-B0-C5-6D-71-26', affectation: 'COMPTABILITE',
    notes: 'Utilisateur : MASIMANGO',
    proprietaire: 'ATS', type: 'IT', status: 'functional', availability: 'assigned', site: 'Kinshasa',
  },
  {
    name: n('HP Desktop', 'ATS-ServeurOdaCompta'),
    marque: 'HP - DESKTOP', serial_number: null, designation: 'ATS-ServeurOdaCompta',
    description: 'Core i3, 4Go RAM, 500 Go HDD',
    adresse_mac: 'A0-D3-C1-2D-3E-55', affectation: 'COMPTABILITE',
    notes: 'Utilisateur : MASIMANGO',
    proprietaire: 'BAGUNA', type: 'IT', status: 'functional', availability: 'assigned', site: 'Kinshasa',
  },
  {
    name: n('HP Desktop', 'DESKTOP-TRESORERIE01'),
    marque: 'HP - DESKTOP', serial_number: null, designation: 'DESKTOP-TRESORERIE01',
    description: 'Core i3, 8Go RAM, 500 Go HDD',
    adresse_mac: 'D0-37-45-E7-29-A4', affectation: 'TRESORERIE',
    notes: 'Utilisateur : KEDIAMOSIKO',
    proprietaire: 'ATS', type: 'IT', status: 'functional', availability: 'assigned', site: 'Kinshasa',
  },
  {
    name: n('HP Laptop', 'DESKTOP-57E0FRR'),
    marque: 'HP - LAPTOP', serial_number: null, designation: 'DESKTOP-57E0FRR',
    description: 'Intel Pentium Silver, 4 Go RAM, 1 To HDD',
    adresse_mac: 'FA-C0-FA-3C-03', affectation: 'COMPTABILITE',
    notes: 'Utilisateur : BAGUNA',
    proprietaire: null, type: 'IT', status: 'functional', availability: 'assigned', site: 'Kinshasa',
  },
  {
    name: 'HP Desktop — Comptabilité',
    marque: 'HP - DESKTOP', serial_number: null, designation: null,
    description: null, adresse_mac: null, affectation: 'COMPTABILITE',
    notes: 'Utilisateur : BAGUNA',
    proprietaire: null, type: 'IT', status: 'functional', availability: 'assigned', site: 'Kinshasa',
  },
  // ── Imprimantes ──────────────────────────────────────────────────────────
  { name: 'Imprimante 1', marque: 'PRINTER', serial_number: null, designation: null, description: null, adresse_mac: null, affectation: null, notes: 'N\'Djili', proprietaire: 'ATS', type: 'other', status: 'functional', availability: 'assigned', site: 'Kinshasa' },
  { name: 'Imprimante 2', marque: 'PRINTER', serial_number: null, designation: null, description: null, adresse_mac: null, affectation: null, notes: 'N\'Djili', proprietaire: 'ATS', type: 'other', status: 'functional', availability: 'assigned', site: 'Kinshasa' },
  { name: 'Imprimante 3', marque: 'PRINTER', serial_number: null, designation: null, description: null, adresse_mac: null, affectation: null, notes: 'Admin Ville', proprietaire: 'ATS', type: 'other', status: 'functional', availability: 'assigned', site: 'Kinshasa' },
  // ── Réseau ───────────────────────────────────────────────────────────────
  {
    name: 'Starlink — N\'Djili',
    marque: 'STARLINK', serial_number: 'GT4060271025HS', designation: null,
    description: null, adresse_mac: null, affectation: 'RÉSEAU',
    notes: 'Antenne Starlink aéroport N\'Djili',
    proprietaire: 'ATS', type: 'network', status: 'functional', availability: 'assigned', site: 'Kinshasa',
  },
  // ── Dell Latitude 7420 — Comptoire BSA ──────────────────────────────────
  {
    name: n('Dell Latitude 7420', 'CSI-ATS — Comptoire 1'),
    marque: 'DELL - LAPTOP Latitude 7420', serial_number: '00330-53673-55994-AAOEM', designation: 'CSI-ATS',
    description: '11th Gen Intel Core i5, 2,60Ghz, 16 Go RAM, 500 Go HDD',
    adresse_mac: '64-6E-E0-65-BD-E1', affectation: 'IT/COMPTOIRE',
    notes: 'Utilisateur : PASSAGE',
    proprietaire: 'ATS', type: 'IT', status: 'functional', availability: 'assigned', site: 'Kinshasa',
  },
  {
    name: n('Dell Latitude 7420', 'CSI-ATS — Comptoire 2'),
    marque: 'DELL - LAPTOP Latitude 7420', serial_number: '00355-62730-24130-AAOEM', designation: 'CSI-ATS',
    description: '11th Gen Intel Core i5, 2,60Ghz, 16 Go RAM, 500 Go HDD',
    adresse_mac: '4C-77-CB-A7-E7-84', affectation: 'IT/COMPTOIRE',
    notes: 'Utilisateur : PASSAGE',
    proprietaire: 'ATS', type: 'IT', status: 'functional', availability: 'assigned', site: 'Kinshasa',
  },
];

async function main() {
  console.log(`Insertion de ${EQUIPMENT.length} équipements…`);

  const res = await fetch(`${URL}/rest/v1/equipment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': ANON,
      'Authorization': `Bearer ${ANON}`,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(EQUIPMENT),
  });

  const body = await res.json();
  if (!res.ok) {
    console.error('Erreur Supabase:', JSON.stringify(body, null, 2));
    process.exit(1);
  }

  console.log(`✓ ${body.length} équipements insérés avec succès !`);
  console.log('Aperçu :', body.slice(0,3).map(e => `  • ${e.name} (${e.id})`).join('\n'));
}

main();
