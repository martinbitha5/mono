// ── Géofencing des sites ATS Handling RDC ─────────────────────────────────────
// Le pointage de présence n'est autorisé que si l'agent se trouve
// physiquement dans la zone de son site de travail (vérifié par GPS).

interface SiteZone {
  lat: number;
  lng: number;
  radius: number; // mètres
  label: string;
}

// Coordonnées des aéroports desservis par ATS Handling.
// Rayon large (3 km) : les plateformes aéroportuaires sont vastes
// (terminal, piste, zones de fret, parkings avions).
export const SITE_ZONES: Record<string, SiteZone> = {
  Kinshasa:     { lat: -4.38575, lng: 15.44460, radius: 3000, label: "Aéroport international de N'Djili (FIH)" },
  Lubumbashi:   { lat: -11.59130, lng: 27.53090, radius: 3000, label: 'Aéroport international de Luano (FBM)' },
  Goma:         { lat: -1.67080, lng: 29.23850, radius: 3000, label: 'Aéroport international de Goma (GOM)' },
  Bukavu:       { lat: -2.30900, lng: 28.80880, radius: 3000, label: 'Aéroport de Kavumu (BKY)' },
  Kisangani:    { lat: 0.48160, lng: 25.33790, radius: 3000, label: 'Aéroport de Bangoka (FKI)' },
  'Mbuji-Mayi': { lat: -6.12120, lng: 23.56900, radius: 3000, label: 'Aéroport de Mbuji-Mayi (MJM)' },
  Kananga:      { lat: -5.90000, lng: 22.46920, radius: 3000, label: 'Aéroport de Kananga (KGA)' },
  Kolwezi:      { lat: -10.76590, lng: 25.50570, radius: 3000, label: 'Aéroport de Kolwezi (KWZ)' },
};

export interface GeoCheckResult {
  distance: number;  // distance au centre du site, en mètres
  accuracy: number;  // précision GPS rapportée, en mètres
  zone: SiteZone;
}

// Distance haversine en mètres entre deux points GPS
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error("Votre appareil ne prend pas en charge la géolocalisation."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, (err) => {
      if (err.code === err.PERMISSION_DENIED) {
        reject(new Error(
          'Localisation refusée. Activez la localisation de votre appareil ' +
          '(et autorisez ce site) pour pointer votre présence.'
        ));
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        reject(new Error("Position introuvable. Vérifiez que le GPS est activé, puis réessayez."));
      } else {
        reject(new Error("Délai dépassé pour obtenir votre position. Réessayez à l'extérieur ou près d'une fenêtre."));
      }
    }, {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 30000,
    });
  });
}

/**
 * Vérifie que l'agent est dans la zone de son site de travail.
 * Rejette avec un message clair en français si :
 *  - la localisation est refusée / indisponible
 *  - l'agent est hors zone
 */
export async function verifyOnSite(site: string): Promise<GeoCheckResult> {
  const zone = SITE_ZONES[site];
  if (!zone) {
    throw new Error(`Site « ${site} » non géoréférencé — contactez un administrateur.`);
  }

  const pos = await getPosition();
  const { latitude, longitude, accuracy } = pos.coords;
  const distance = haversine(latitude, longitude, zone.lat, zone.lng);

  // Marge de tolérance = précision GPS rapportée (plafonnée à 500 m
  // pour éviter qu'une position très imprécise valide n'importe où).
  const tolerance = Math.min(accuracy ?? 0, 500);

  if (distance - tolerance > zone.radius) {
    const km = distance >= 1000 ? `${(distance / 1000).toFixed(1)} km` : `${Math.round(distance)} m`;
    throw new Error(
      `Pointage refusé : vous êtes à ${km} de ${zone.label}. ` +
      `La présence ne peut être enregistrée que sur votre lieu de travail.`
    );
  }

  return { distance, accuracy: accuracy ?? 0, zone };
}

/** Formate la distance pour les notes de pointage. */
export function formatGeoNote(r: GeoCheckResult): string {
  const d = r.distance >= 1000 ? `${(r.distance / 1000).toFixed(1)} km` : `${Math.round(r.distance)} m`;
  return `GPS ✓ ${d} du site`;
}
