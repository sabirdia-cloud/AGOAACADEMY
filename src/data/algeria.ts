import { wilayas as rawWilayas, getCommunesByWilayaId } from 'algeria-locations';

export const wilayas = rawWilayas.map(w => ({
  id: w.id.toString(),
  name: w.name_ar
}));

export const algeriaCities: Record<string, string[]> = {};

rawWilayas.forEach(w => {
  const communes = getCommunesByWilayaId(w.id);
  algeriaCities[w.id.toString()] = communes.map(c => c.name_ar);
});
