-- ══════════════════════════════════════════════════════════════════════════════
-- Inventaire Informatique ATS Handling RDC — Septembre 2025
-- Source : INVENTAIRE INFORMATIQUE SEPTEMBRE 2025.xlsx
-- Site : Kinshasa (Aéroport N'Djili + Administration Ville)
--
-- ÉTAPE 1 : Rend serial_number nullable + index partiel (unique seulement
--           sur les vraies valeurs, pas sur NULL/vide)
-- ÉTAPE 2 : Insère les 34 équipements
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Étape 1 — Adapter la contrainte serial_number ────────────────────────────
ALTER TABLE equipment ALTER COLUMN serial_number DROP NOT NULL;
ALTER TABLE equipment DROP CONSTRAINT IF EXISTS equipment_serial_number_key;
DROP INDEX  IF EXISTS equipment_serial_number_key;
CREATE UNIQUE INDEX IF NOT EXISTS equipment_serial_number_unique
  ON equipment (serial_number)
  WHERE serial_number IS NOT NULL AND serial_number <> '';

-- ── Étape 2 — Insertion de l'inventaire ──────────────────────────────────────
INSERT INTO equipment (
  name, marque, serial_number, designation, description,
  adresse_mac, affectation, notes, proprietaire,
  type, status, availability, site
) VALUES

-- ── Postes CSI / OPS / FIH / ESCALE — Aéroport N'Djili ──────────────────────
('CSI-ATS 0003 — Lenovo',        'LENOVO',                    'R90VS4XT',               'CSI-ATS 0003',        'Intel® CPU 1,80 Ghz, 4Go RAM, 1 To HDD',                    'DC-71-96-0D-D2-7F', 'IT/Logistique',       'Utilisateur : LOUISON — ID OEM : 00001-AA323',         'ATS',       'IT',      'functional', 'assigned', 'Kinshasa'),
('CSI-ATS 0001 — Dell',          'DELL',                      NULL,                     'CSI-ATS 0001',        'AMD Ryzen CPU 3,30 Ghz, 16Go RAM, 1 To HDD',                '3C-0A-F3-A9-62-CD', 'IT/Département',      'Utilisateur : PAPPUIS — ID OEM : 22438-AAOEM',         'ATS',       'IT',      'functional', 'assigned', 'Kinshasa'),
('CSI-ATS 0002 — Dell',          'DELL',                      NULL,                     'CSI-ATS 0002',        'Intel® i7 CPU 2,60 Ghz, 16Go RAM, 238 Go HDD',              'C8-F7-50-2F-FB-98', 'IT/Développement',    'Utilisateur : MARTIN — ID OEM : 91307-AAOEM',          'ATS',       'IT',      'functional', 'assigned', 'Kinshasa'),
('OPS 0004 — Lenovo',            'LENOVO',                    NULL,                     'OPS 0004',            '13th Gen Intel® Core™ i7 2,40 Ghz, 16Go RAM, 500 Go HDD',  '40-C2-BA-6A-56-98', 'IT/OPS',              'Utilisateur : POSTE/1 — ID OEM : 00001-AA175',         'ATS',       'IT',      'functional', 'assigned', 'Kinshasa'),
('OPS2 — HP',                    'HP LE1901w',                NULL,                     'OPS2',                'Pentium® Dual-Core CPU 3,00Ghz, 6Go RAM, 300 Go HDD',       '44-37-E6-44-09-43', 'IT/OPS',              'Utilisateur : POSTE/2 — Non Available (ID)',            'ATS',       'IT',      'functional', 'assigned', 'Kinshasa'),
('ATS-OPS1 — HP',                'HP',                        NULL,                     'ATS-OPS1',            'Intel® Celeron® 2,00Ghz, 8Go RAM, 477 Go HDD',              'D4-61-37-02-9F-A7', 'IT/OPS',              'Utilisateur : POSTE/3 — ID OEM : 46187-AAOEM',         'ATS',       'IT',      'functional', 'assigned', 'Kinshasa'),
('ATS0725-03 — HP',              'HP',                        '1H852655CX',             'ATS0725-03',          '13th Gen Intel(R) Core™ i3 1,20 Ghz, 8 Go RAM, 238 Go HDD','F8-3D-C6-74-25-38', 'IT/Business',         'Utilisateur : PASSAGES — ID OEM : 41840-AAOEM',        'ATS',       'IT',      'functional', 'assigned', 'Kinshasa'),
('ATS-FIH1 — HP',                'HP',                        'MZ00WL4P',               'ATS-FIH1',            'Intel® Core™ i5 2,50Ghz, 8Go RAM, 238 Go HDD',              'E8-B0-C5-B7-7D-F2', 'IT/Comptoire 1a',     'Utilisateur : PASSAGES — ID OEM : 56434-AAOEM',        'ATS',       'IT',      'functional', 'assigned', 'Kinshasa'),
('PCMBSA02 — Comptoire 1b — HP', 'HP',                        'CZC4397WK7',             'PCMBSA02',            '12th Gen Intel® Core™ i5 3Ghz, 16Go RAM, 1.14 TB HDD',     'E0-8F-4C-5A-5D-57', 'IT/Comptoire 1b',     'Utilisateur : PASSAGES — ID OEM : 79159-AAOEM',        'ATS',       'IT',      'functional', 'assigned', 'Kinshasa'),
('PCMBSA02 — Comptoire 2a — HP', 'HP',                        'CZC4397WK0',             'PCMBSA02',            '12th Gen Intel® Core™ i5 3Ghz, 16Go RAM, 1.16 TB HDD',     '28-C5-C8-80-59-F4', 'IT/Comptoire 2a',     'Utilisateur : PASSAGES — ID OEM : 79093-AAOEM',        'ATS',       'IT',      'functional', 'assigned', 'Kinshasa'),
('ATS-FIH2 — HP',                'HP',                        NULL,                     'ATS-FIH2',            'Intel® Core™ i5 2,50Ghz, 8Go RAM, 236 Go HDD',              'D0-F4-05-33-81-40', 'IT/Comptoire 2b',     'Utilisateur : PASSAGES — ID OEM : 53501-AAOEM',        'ATS',       'IT',      'functional', 'assigned', 'Kinshasa'),
('ATS 007 — HP',                 'HP',                        NULL,                     'ATS 007',             '13th Gen Intel(R) Core™ i3 1,20 Ghz, 8 Go RAM, 238 Go HDD','F8-3D-C6-73-C8-A4', 'IT/ESCALE',           'Utilisateur : RUBIN — ID OEM : 41986-AAOEM',           'ATS',       'IT',      'functional', 'assigned', 'Kinshasa'),
('ATS — HP Escale',              'HP',                        '5CD61073SM',             'ATS',                 'AMD A8-7410 APU, 2,20 Ghz, 4 Go RAM',                       'A8-A7-95-83-7A-87', 'IT/SCALE',            'Utilisateur : MARCELINE',                              'ATS',       'IT',      'functional', 'assigned', 'Kinshasa'),

-- ── Laptops N'Djili / partagés ────────────────────────────────────────────────
('WINTERFELL — Dell Laptop',               'DELL - LAPTOP',             NULL,           'WINTERFELL',          '13th Gen Intel Core i7-1355U, 16,0 Go RAM, 1 To HDD',       'BC-03-58-39-BB-78', 'IT',                  'Utilisateur : ARISTARQUE',                             'ARISTARQUE','IT',      'functional', 'assigned', 'Kinshasa'),
('ATS0725-07 — HP Laptop',                 'HP - LAPTOP',               NULL,           'ATS0725-07',          '13th Gen Intel Core i3-1315, 8GB RAM, HDD 256 Go',          'F8-3D-C6-72-B0-B9', NULL,                  'Non affecté',                                          'ATS',       'IT',      'functional', 'available','Kinshasa'),
('HP Laptop — Secrétariat',                'HP - LAPTOP',               NULL,           NULL,                  NULL,                                                         NULL,                'SECRETARIAT',         'Utilisateur : NAOMIE',                                 'ATS',       'IT',      'functional', 'assigned', 'Kinshasa'),
('Lenovo Chromebook — IT',                 'LENOVO CHROMEBOOK - LAPTOP', NULL,          NULL,                  NULL,                                                         NULL,                'IT',                  'Utilisateur : ARISTARQUE',                             'ATS',       'IT',      'functional', 'assigned', 'Kinshasa'),
('LAPTOP-ATS-SG-00 — Asus VivoBook',       'ASUS VIVOBOOK - LAPTOP',    NULL,           'LAPTOP-ATS-SG-00',    'Core i5, 16 Go RAM, 1 To HDD',                              NULL,                'IT',                  'Utilisateur : GINO NGIMBI',                            'ATS',       'IT',      'functional', 'assigned', 'Kinshasa'),

-- ── Laptops Administration Ville — RH / Secrétariat Général ─────────────────
('LAPTOP-ATS-RH-00 — HP Laptop',           'HP - LAPTOP',               NULL,           'LAPTOP-ATS-RH-00',    'AMD Ryzen, 8 Go RAM, 256 Go HDD',                           '5C-FB-3A-9C-52-0E', 'RH',                  'Utilisateur : MICHEL KITENGE — Admin Ville',           'ATS',       'IT',      'functional', 'assigned', 'Kinshasa'),
('LAPTOP-ATS-SG-00 — Asus VivoBook (Sec)', 'ASUS VIVOBOOK - LAPTOP',    NULL,           'LAPTOP-ATS-SG-00',    '12th Gen Intel Core i5, 16 Go RAM, HDD 500 Go',             '4C-B0-42-26-A2-07', 'SECRETARIAT GÉNÉRAL', 'Utilisateur : PAULIN KEKUMBA — Admin Ville',           'ATS',       'IT',      'functional', 'assigned', 'Kinshasa'),

-- ── Desktops Comptabilité / Trésorerie ───────────────────────────────────────
('Lenovo Desktop — Compta (Abel)',          'LENOVO - DESKTOP',          NULL,           NULL,                  'Core i3, 8Go RAM, 256 Go HDD',                              NULL,                'COMPTABILITE',        'Utilisateur : ABEL DIAKESE',                           'ATS',       'IT',      'functional', 'assigned', 'Kinshasa'),
('ATSCOMPTA-03 — Lenovo Desktop',          'LENOVO - DESKTOP',          NULL,           'ATSCOMPTA-03',        'Core i5, 8Go RAM, 256 Go HDD',                              'B8-1E-A4-7B-34-1A', 'COMPTABILITE',        'Utilisateur : ELYSA BASUBI',                           'ATS',       'IT',      'functional', 'assigned', 'Kinshasa'),
('ATSCOMPTA-04 — Lenovo Desktop',          'LENOVO - DESKTOP',          NULL,           'ATSCOMPTA-04',        'Core i3, 8Go RAM, 256 Go HDD',                              'E8-B0-C5-4F-7B-BB', 'COMPTABILITE',        'Utilisateur : BIJOU OPOWA',                            'ATS',       'IT',      'functional', 'assigned', 'Kinshasa'),
('ATSCOMPTA1 — Lenovo Desktop',            'LENOVO - DESKTOP',          NULL,           'ATSCOMPTA1',          'Core i5, 8 Go RAM, 256 Go HDD',                             'EA-B0-C5-6D-71-26', 'COMPTABILITE',        'Utilisateur : MASIMANGO',                              'ATS',       'IT',      'functional', 'assigned', 'Kinshasa'),
('ATS-ServeurOdaCompta — HP Desktop',      'HP - DESKTOP',              NULL,           'ATS-ServeurOdaCompta','Core i3, 4Go RAM, 500 Go HDD',                              'A0-D3-C1-2D-3E-55', 'COMPTABILITE',        'Utilisateur : MASIMANGO',                              'BAGUNA',    'IT',      'functional', 'assigned', 'Kinshasa'),
('DESKTOP-TRESORERIE01 — HP Desktop',      'HP - DESKTOP',              NULL,           'DESKTOP-TRESORERIE01','Core i3, 8Go RAM, 500 Go HDD',                              'D0-37-45-E7-29-A4', 'TRESORERIE',          'Utilisateur : KEDIAMOSIKO',                            'ATS',       'IT',      'functional', 'assigned', 'Kinshasa'),
('DESKTOP-57E0FRR — HP Laptop',            'HP - LAPTOP',               NULL,           'DESKTOP-57E0FRR',     'Intel Pentium Silver, 4 Go RAM, 1 To HDD',                  'FA-C0-FA-3C-03',    'COMPTABILITE',        'Utilisateur : BAGUNA',                                 NULL,        'IT',      'functional', 'assigned', 'Kinshasa'),
('HP Desktop — Comptabilité (Baguna)',      'HP - DESKTOP',              NULL,           NULL,                  NULL,                                                         NULL,                'COMPTABILITE',        'Utilisateur : BAGUNA',                                 NULL,        'IT',      'functional', 'assigned', 'Kinshasa'),

-- ── Imprimantes ──────────────────────────────────────────────────────────────
('Imprimante 1',  'PRINTER', NULL, NULL, NULL, NULL, NULL, 'N''Djili',    'ATS', 'other', 'functional', 'assigned', 'Kinshasa'),
('Imprimante 2',  'PRINTER', NULL, NULL, NULL, NULL, NULL, 'N''Djili',    'ATS', 'other', 'functional', 'assigned', 'Kinshasa'),
('Imprimante 3',  'PRINTER', NULL, NULL, NULL, NULL, NULL, 'Admin Ville', 'ATS', 'other', 'functional', 'assigned', 'Kinshasa'),

-- ── Réseau ────────────────────────────────────────────────────────────────────
('Starlink — N''Djili', 'STARLINK', 'GT4060271025HS', NULL, NULL, NULL, 'RÉSEAU', 'Antenne Starlink aéroport N''Djili', 'ATS', 'network', 'functional', 'assigned', 'Kinshasa'),

-- ── Dell Latitude 7420 — Comptoire BSA ───────────────────────────────────────
('CSI-ATS — Dell Latitude 7420 (1)', 'DELL - LAPTOP Latitude 7420', '00330-53673-55994-AAOEM', 'CSI-ATS', '11th Gen Intel Core i5, 2,60Ghz, 16 Go RAM, 500 Go HDD', '64-6E-E0-65-BD-E1', 'IT/COMPTOIRE', 'Utilisateur : PASSAGE', 'ATS', 'IT', 'functional', 'assigned', 'Kinshasa'),
('CSI-ATS — Dell Latitude 7420 (2)', 'DELL - LAPTOP Latitude 7420', '00355-62730-24130-AAOEM', 'CSI-ATS', '11th Gen Intel Core i5, 2,60Ghz, 16 Go RAM, 500 Go HDD', '4C-77-CB-A7-E7-84', 'IT/COMPTOIRE', 'Utilisateur : PASSAGE', 'ATS', 'IT', 'functional', 'assigned', 'Kinshasa');
