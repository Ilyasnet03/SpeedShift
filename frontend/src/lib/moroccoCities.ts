export const MOROCCAN_CITIES: string[] = [
  'Agadir', 'Aïn Harrouda', 'Aïn Taoujdate', 'Aït Melloul', 'Aït Ourir', 'Akka', 'Al Hoceïma', 'Alnif', 'Aoulouz', 'Arfoud',
  'Assa', 'Assilah', 'Azemmour', 'Azilal', 'Azrou', 'Beni Ansar', 'Béni Mellal', 'Benguerir', 'Beni Tadjit', 'Ben Slimane',
  'Berkane', 'Berrechid', 'Bin el Ouidane', 'Biougra', 'Bir Anzarane', 'Bir Jdid', 'Bouarfa', 'Boujdour', 'Boujniba', 'Boulemane',
  'Bouknadel', 'Bouskoura', 'Bouznika', 'Casablanca', 'Chefchaouen', 'Chichaoua', 'Dakhla', 'Dar Bouazza', 'Demnate', 'Dcheira El Jihadia',
  'Driouch', 'El Aïoun Sidi Mellouk', 'El Hajeb', 'El Jadida', 'El Kelaâ des Sraghna', 'Errachidia', 'Er-Rich', 'Essaouira', 'Fès', 'Figuig',
  'Fnideq', 'Fquih Ben Salah', 'Guelmim', 'Guercif', 'Guigou', 'Midar', 'Had Soualem', 'Harhoura', 'Ifrane', 'Imintanoute',
  'Imouzzer Kandar', 'Imzouren', 'Inezgane', 'Jerada', 'Kariat Arekmane', 'Kasba Tadla', 'Kénitra', 'Kelaat M\'Gouna', 'Khémisset', 'Khénifra',
  'Khouribga', 'Ksar El Kébir', 'Ksar es Seghir', 'Laâyoune', 'Laâtamna', 'Larache', 'Lakhsas', 'Lagouira', 'Lahraouyine', 'Lalla Mimouna',
  'Marrakech', 'Martil', 'M\'diq', 'Mechra Bel Ksiri', 'Mehdia', 'Meknès', 'Midelt', 'Missour', 'Mohammedia', 'Moulay Bousselham',
  'Moulay Yacoub', 'Nador', 'Neima', 'Oualidia', 'Ouarzazate', 'Oued Zem', 'Oued Laou', 'Ouezzane', 'Oujda', 'Oulad Teima',
  'Oulad Frej', 'Oulad Abbou', 'Ouled Berhil', 'Ras El Ma', 'Rabat', 'Ribate El Kheir', 'Rissani', 'Safi', 'Saïdia', 'Salé',
  'Sebt Gzoula', 'Sefrou', 'Settat', 'Sidi Bennour', 'Sidi Bibi', 'Sidi Ifni', 'Sidi Kacem', 'Sidi Rahal', 'Sidi Slimane', 'Sidi Yahya El Gharb',
  'Skhirat', 'Smara', 'Souk El Arbaa', 'Tafraout', 'Tahannaout', 'Talsint', 'Tamanar', 'Tan-Tan', 'Tanger',
  'Taounate', 'Taourirt', 'Tarfaya', 'Targuist', 'Taroudant', 'Tata', 'Taza', 'Témara', 'Tétouan', 'Tifelt',
  'Tinejdad', 'Tinghir', 'Tiznit', 'Tit Mellil', 'Youssoufia', 'Zagora', 'Zaïo', 'Zaouiat Cheikh', 'Zeghanghane', 'Zinat'
].sort((a, b) => a.localeCompare(b, 'fr'));

export const normalizeCityText = (value: string) =>
  value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/['’_-]+/g, ' ').replace(/\s+/g, ' ');

export function searchCities(query: string, limit = 50): string[] {
  const needle = normalizeCityText(query);
  if (!needle) return MOROCCAN_CITIES.slice(0, limit);
  const starts: string[] = [];
  const contains: string[] = [];
  for (const city of MOROCCAN_CITIES) {
    const normalized = normalizeCityText(city);
    if (normalized.startsWith(needle)) starts.push(city);
    else if (normalized.includes(needle)) contains.push(city);
  }
  return [...starts, ...contains].slice(0, limit);
}
