import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { MOROCCAN_CITIES } from './lib/moroccoCities';
import { whatsappUrl } from './lib/whatsapp';
import {
  ApiError, assetUrl, deleteRentalVehicle, getMyRentalAgency, getMyRentalVehicles, getMyRentalQuota,
  getRentalAgencies, getRentalStore, getRentalVehicles, saveRentalAgency, saveRentalVehicle, uploadImage,
  type RentalAgency, type RentalAgencyInput, type RentalVehicle, type RentalVehicleInput
} from './services/api';

const fieldClass = 'w-full rounded-xl border border-white/10 bg-[#0d0f10] p-3 text-white';
const buttonClass = 'rounded-full bg-ember px-5 py-3 text-sm font-medium text-white disabled:opacity-60';
const panelClass = 'rounded-[28px] border border-white/10 bg-[#121416] p-5 sm:p-6';
const statusLabels = { ACTIVE: 'Actif', RENTED: 'Loué', PAUSED: 'En pause' };
const emptyAgency: RentalAgencyInput = { name: '', logo: '', phone: '', email: '', city: '', address: '', description: '' };
const emptyVehicle: RentalVehicleInput = {
  title: '', brand: '', model: '', year: new Date().getFullYear(), category: 'Citadine',
  dailyPrice: 1, fuel: 'Diesel', transmission: 'Manuelle', status: 'ACTIVE', photos: []
};
const price = (value: number) => `${new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 2 }).format(value)} DH / jour`;
const errorText = (error: unknown) => error instanceof Error ? error.message : 'Une erreur est survenue. Réessayez.';

function CityChoices() {
  return <datalist id="rental-cities">{MOROCCAN_CITIES.map((city) => <option key={city} value={city} />)}</datalist>;
}

function RentalCard({ vehicle }: { vehicle: RentalVehicle }) {
  const [selected, setSelected] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const invalidDates = Boolean(startDate && endDate && startDate > endDate);
  const dates = [
    startDate && `Début souhaité : ${startDate}`,
    endDate && `Fin souhaitée : ${endDate}`
  ].filter(Boolean);
  const message = `Bonjour, je suis intéressé(e) par la location du véhicule « ${vehicle.title} » (${vehicle.brand} ${vehicle.model}, ${vehicle.year}) à ${price(vehicle.dailyPrice)} sur SpeedShift.${dates.length ? `\n${dates.join('\n')}` : ''}\nEst-il disponible ?`;
  const contactUrl = whatsappUrl(vehicle.agency.phone, message);
  return (
    <article className="min-w-0 rounded-[20px] border border-white/10 bg-[#121416] p-3 sm:rounded-[28px] sm:p-5">
      <img src={assetUrl(vehicle.photos[selected] ?? vehicle.photos[0])} alt={vehicle.title} className="aspect-[3/2] w-full rounded-xl object-cover" />
      {vehicle.photos.length > 1 && <div className="mt-2 flex gap-2 overflow-auto">
        {vehicle.photos.map((photo, index) => <button key={`${photo}-${index}`} type="button" onClick={() => setSelected(index)} aria-label={`Photo ${index + 1} de ${vehicle.title}`} aria-pressed={selected === index}>
          <img src={assetUrl(photo)} alt="" className={`h-12 w-16 rounded object-cover ${selected === index ? 'ring-2 ring-ember' : ''}`} />
        </button>)}
      </div>}
      <h2 className="mt-3 break-words text-sm font-semibold text-white sm:text-xl">{vehicle.title}</h2>
      <p className="mt-1 break-words text-sm font-semibold text-ember sm:text-base">{price(vehicle.dailyPrice)}</p>
      <p className="mt-2 break-words text-xs text-stone sm:text-sm">{vehicle.brand} {vehicle.model} · {vehicle.year} · {vehicle.category} · {vehicle.fuel} · {vehicle.transmission}</p>
      <Link to={`/location/agence/${vehicle.agency.id}`} className="mt-4 flex items-center gap-2 text-white hover:text-ember">
        <img src={assetUrl(vehicle.agency.logo)} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover sm:h-10 sm:w-10" />
        <span className="min-w-0 break-words text-xs sm:text-base">{vehicle.agency.name} · {vehicle.agency.city}</span>
      </Link>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <a className="rounded-full bg-ember px-2 py-3 text-center text-xs font-medium text-white sm:px-5 sm:text-sm" href={`tel:${vehicle.agency.phone}`}>Appeler l'agence</a>
        <a className="rounded-full border border-white/20 px-2 py-3 text-center text-xs text-white sm:px-5 sm:text-sm" href={`mailto:${vehicle.agency.email}?subject=${encodeURIComponent(`Location : ${vehicle.title}`)}`}>Envoyer un e-mail</a>
      </div>
      <details className="mt-3 text-xs text-stone sm:text-sm">
        <summary className="cursor-pointer">Dates souhaitées (facultatif)</summary>
        <div className="mt-2 grid grid-cols-1 gap-2">
          <label className="block min-w-0">Début
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="mt-1 block min-w-0 w-full rounded-lg border border-white/10 bg-[#0d0f10] p-2 text-xs text-white" />
          </label>
          <label className="block min-w-0">Fin
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="mt-1 block min-w-0 w-full rounded-lg border border-white/10 bg-[#0d0f10] p-2 text-xs text-white" />
          </label>
          {invalidDates && <p role="alert" className="text-red-400">La date de fin doit suivre la date de début.</p>}
        </div>
      </details>
      {contactUrl && !invalidDates ? <a href={contactUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block rounded-full bg-[#25D366] px-2 py-3 text-center text-xs font-medium text-white sm:px-5 sm:text-sm">Contacter sur WhatsApp</a>
        : <p role="status" className="mt-3 text-xs text-stone">{invalidDates ? 'Corrigez les dates pour contacter l’agence sur WhatsApp.' : 'Numéro WhatsApp indisponible.'}</p>}
    </article>
  );
}

function VehicleGrid({ vehicles }: { vehicles: RentalVehicle[] }) {
  return vehicles.length ? <div className="grid grid-cols-2 gap-3 sm:gap-5">{vehicles.map((vehicle) => <RentalCard key={vehicle.id} vehicle={vehicle} />)}</div>
    : <p className="text-stone">Aucun véhicule disponible pour le moment.</p>;
}

export function RentalCatalogPage() {
  const [city, setCity] = useState('');
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [transmission, setTransmission] = useState('');
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'vehicles' | 'agencies'>('vehicles');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const invalidPrices = Boolean((min && Number(min) < 0) || (max && Number(max) < 0) || (min && max && Number(min) > Number(max)));
  const filters = useMemo(() => {
    const params = new URLSearchParams();
    if (city.trim()) params.set('city', city.trim());
    if (min) params.set('minPrice', min);
    if (max) params.set('maxPrice', max);
    if (transmission) params.set('transmission', transmission);
    return params.toString();
  }, [city, min, max, transmission]);
  const vehiclesQuery = useQuery({
    queryKey: ['rentals', filters], queryFn: () => getRentalVehicles(new URLSearchParams(filters)),
    enabled: !invalidPrices
  });
  const agenciesQuery = useQuery({ queryKey: ['rental-agencies'], queryFn: getRentalAgencies, enabled: view === 'agencies' });
  const normalize = (value: string) => value.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const term = normalize(search.trim());
  const matches = (value: string) => !term || normalize(value).includes(term);
  const vehicles = vehiclesQuery.data ?? [];
  const filteredVehicles = vehicles.filter((vehicle) => matches(`${vehicle.title} ${vehicle.brand} ${vehicle.model} ${vehicle.category} ${vehicle.agency.name} ${vehicle.agency.city}`));
  const agencyResults = (agenciesQuery.data ?? []).flatMap((agency) => {
    if (city && normalize(agency.city.trim()) !== normalize(city)) return [];
    const matchingVehicles = vehicles.filter((vehicle) => vehicle.agency.id === agency.id);
    const agencyMatches = matches(`${agency.name} ${agency.city}`);
    const relevant = agencyMatches ? matchingVehicles : matchingVehicles.filter((vehicle) => matches(`${vehicle.title} ${vehicle.brand} ${vehicle.model} ${vehicle.category}`));
    if ((min || max || transmission) && !relevant.length) return [];
    if (term && !agencyMatches && !relevant.length) return [];
    return [{ agency, count: relevant.length }];
  });
  const count = view === 'vehicles' ? filteredVehicles.length : agencyResults.length;
  const activeFilters = [min, max, transmission].filter(Boolean).length;
  const loading = vehiclesQuery.isLoading || (view === 'agencies' && agenciesQuery.isLoading);
  const failed = vehiclesQuery.isError || (view === 'agencies' && agenciesQuery.isError);
  const reset = () => { setText(''); setSearch(''); setCity(''); setMin(''); setMax(''); setTransmission(''); };

  return <div className="catalog-page space-y-5">
    <section className="catalog-search-panel rounded-[26px] border border-white/10 bg-[#121416] p-5">
      <div className="text-[10px] uppercase tracking-[0.28em] text-ember">Recherche</div>
      <h1 className="mt-1 font-display text-4xl uppercase text-white">Location de véhicules</h1>
      <form onSubmit={(event) => { event.preventDefault(); setSearch(text.trim()); }} className="catalog-search-bar mt-4 flex w-full items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-1.5">
        <Search size={18} className="ml-2 shrink-0 text-stone" />
        <input aria-label="Rechercher une location ou une agence" value={text} onChange={(event) => setText(event.target.value)} placeholder="Marque, modèle, agence ou mots-clés…" className="w-full bg-transparent text-sm text-white placeholder:text-stone/60 focus:outline-none" />
        <button type="submit" className="rounded-lg bg-ember px-4 py-2 text-sm font-semibold text-white">GO</button>
      </form>
    </section>
    <section className="space-y-4">
      {filtersOpen && <aside id="rental-detailed-filters" className="rounded-[26px] border border-white/10 bg-[#121416] p-5">
        <div className="mb-4 flex items-center justify-between"><div className="text-[10px] uppercase tracking-[0.3em] text-ember">Critères de recherche</div><button type="button" onClick={() => setFiltersOpen(false)} className="text-xs uppercase tracking-[0.2em] text-stone hover:text-white">Fermer</button></div>
        <div className="grid gap-4 text-sm text-stone sm:grid-cols-2">
          <div className="space-y-2"><span>Prix par jour (DH)</span><div className="grid grid-cols-2 gap-2">
            <input aria-label="Prix minimum par jour" type="number" min="0" step="0.01" value={min} onChange={(event) => setMin(event.target.value)} placeholder="Min" className={fieldClass} />
            <input aria-label="Prix maximum par jour" type="number" min="0" step="0.01" value={max} onChange={(event) => setMax(event.target.value)} placeholder="Max" className={fieldClass} />
          </div></div>
          <label className="block space-y-2"><span>Boîte de vitesses</span><select value={transmission} onChange={(event) => setTransmission(event.target.value)} className={fieldClass}><option value="">Toutes</option><option>Manuelle</option><option>Automatique</option></select></label>
        </div>
      </aside>}
      {invalidPrices && <p role="alert" className="text-sm text-red-400">Les prix doivent être positifs et le minimum ne peut pas dépasser le maximum.</p>}
      <div className="catalog-controls">
        <div className="catalog-select-row">
          <label className="sr-only" htmlFor="rental-city">Ville</label>
          <input id="rental-city" list="rental-catalog-cities" value={city} onChange={(event) => setCity(event.target.value)} placeholder="Toutes les villes" className="catalog-select" />
          <datalist id="rental-catalog-cities">{MOROCCAN_CITIES.map((name) => <option key={name} value={name} />)}</datalist>
        </div>
        <div className="catalog-city-chips">
          {['', 'Casablanca', 'Rabat', 'Marrakech'].map((name) => <button key={name} type="button" onClick={() => setCity(name)} className={`rounded-full border px-3 py-1 text-xs transition ${city === name ? 'border-ember bg-ember text-white' : 'border-white/10 text-stone hover:text-white'}`}>{name || 'Toutes'}</button>)}
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Affichage des locations">
          <button type="button" aria-pressed={view === 'vehicles'} onClick={() => setView('vehicles')} className={`rounded-full border px-4 py-2 text-sm ${view === 'vehicles' ? 'border-ember bg-ember text-white' : 'border-white/10 text-stone'}`}>Par véhicule</button>
          <button type="button" aria-pressed={view === 'agencies'} onClick={() => setView('agencies')} className={`rounded-full border px-4 py-2 text-sm ${view === 'agencies' ? 'border-ember bg-ember text-white' : 'border-white/10 text-stone'}`}>Par agence</button>
        </div>
        <div className="catalog-result-row">
          <span className="text-sm text-stone/80">{invalidPrices || loading || failed ? 'Résultats indisponibles' : `${count} ${view === 'vehicles' ? `véhicule${count > 1 ? 's' : ''}` : `agence${count > 1 ? 's' : ''}`}`}</span>
          <button type="button" onClick={() => setFiltersOpen((open) => !open)} className="inline-flex items-center gap-1 text-sm text-stone hover:text-white" aria-expanded={filtersOpen} aria-controls="rental-detailed-filters"><SlidersHorizontal size={14} /> Filtres{activeFilters ? ` (${activeFilters})` : ''}</button>
          <button type="button" onClick={reset} className="text-sm text-ember hover:text-white">Réinitialiser</button>
        </div>
      </div>
      {view === 'agencies' && <p className="text-sm text-stone">Les filtres de prix et de boîte affichent les agences ayant au moins un véhicule correspondant.</p>}
      {invalidPrices ? null : loading ? <p role="status">Chargement…</p> : failed ? <p role="alert">Impossible de charger les locations. <button type="button" className="text-ember" onClick={() => { void vehiclesQuery.refetch(); if (view === 'agencies') void agenciesQuery.refetch(); }}>Réessayer</button></p> : view === 'vehicles' ? <VehicleGrid vehicles={filteredVehicles} /> :
        agencyResults.length ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{agencyResults.map(({ agency, count: vehicleCount }) => <article key={agency.id} className={panelClass}>
          <Link to={`/location/agence/${agency.id}`} className="flex items-center gap-4 text-white hover:text-ember"><img src={assetUrl(agency.logo)} alt="" className="h-16 w-16 rounded-full object-cover" /><div><h2 className="text-xl font-semibold">{agency.name}</h2><p className="text-sm text-stone">{agency.city}</p></div></Link>
          <p className="mt-4 whitespace-pre-wrap text-sm text-stone">{agency.description}</p>
          <p className="mt-3 text-sm">{vehicleCount} véhicule{vehicleCount > 1 ? 's' : ''} disponible{vehicleCount > 1 ? 's' : ''}{min || max || transmission || (term && !matches(`${agency.name} ${agency.city}`)) ? ' correspondant' + (vehicleCount > 1 ? 's' : '') : ''}</p>
          <Link to={`/location/agence/${agency.id}`} className="mt-4 inline-block text-ember">Voir le magasin</Link>
        </article>)}</div> : <p>Aucune agence ne correspond à votre recherche.</p>}
    </section>
  </div>;
}

export function RentalStorePage() {
  const { id = '' } = useParams();
  const query = useQuery({ queryKey: ['rental-store', id], queryFn: () => getRentalStore(id), retry: false });
  if (query.isLoading) return <p>Chargement…</p>;
  if (query.isError || !query.data) return <p role="alert">Cette agence est introuvable ou indisponible.</p>;
  const { agency, vehicles } = query.data;
  return <section className="space-y-6">
    <div className={panelClass}>
      <div className="flex items-center gap-4"><img src={assetUrl(agency.logo)} alt={`Logo ${agency.name}`} className="h-20 w-20 rounded-full object-cover" /><div><h1 className="font-display text-4xl text-white">{agency.name}</h1><p>{agency.city}</p></div></div>
      <p className="mt-4 whitespace-pre-wrap">{agency.description}</p>
      <p className="mt-3">{agency.address}, {agency.city}</p>
      <div className="mt-3 flex flex-wrap gap-4"><a className="text-ember" href={`tel:${agency.phone}`}>{agency.phone}</a><a className="text-ember" href={`mailto:${agency.email}`}>{agency.email}</a></div>
    </div>
    <h2 className="text-2xl text-white">Véhicules disponibles</h2><VehicleGrid vehicles={vehicles} />
  </section>;
}

function AgencyForm({ agency, onSaved }: { agency?: RentalAgency; onSaved: () => void }) {
  const [form, setForm] = useState<RentalAgencyInput>(agency ?? emptyAgency);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const mutation = useMutation({ mutationFn: saveRentalAgency, onSuccess: onSaved });
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadError(''); setUploading(true);
    try { const result = await uploadImage(file); setForm((current) => ({ ...current, logo: result.url })); }
    catch (error) { setUploadError(errorText(error)); }
    finally { setUploading(false); event.target.value = ''; }
  }
  return <form className={`${panelClass} space-y-4`} onSubmit={(event) => { event.preventDefault(); mutation.mutate(form); }}>
    <h2 className="text-2xl text-white">Mon magasin</h2>
    <div className="grid gap-4 md:grid-cols-2">
      <label>Nom de l'agence<input required maxLength={120} className={fieldClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
      <label>Ville principale<input required maxLength={120} list="rental-cities" className={fieldClass} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label>
      <label>Téléphone marocain<input required pattern="(?:\+212|0)[567][0-9]{8}" placeholder="+212612345678" className={fieldClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
      <label>E-mail de contact<input required type="email" maxLength={255} className={fieldClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
      <label className="md:col-span-2">Adresse<input required maxLength={255} className={fieldClass} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
      <label className="md:col-span-2">Description<textarea required maxLength={2000} className={fieldClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
      <label className="md:col-span-2">Logo (JPG, PNG ou WebP)<input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={upload} className="mt-2 block w-full" /></label>
      {form.logo && <img src={assetUrl(form.logo)} alt="Logo de l'agence" className="h-20 w-20 rounded-full object-cover" />}
      <CityChoices />
    </div>
    {uploadError && <p role="alert" className="text-red-400">{uploadError}</p>}
    {mutation.isError && <p role="alert" className="text-red-400">Enregistrement impossible. Vérifiez les informations et réessayez.</p>}
    {mutation.isSuccess && <p role="status" className="text-emerald-400">Magasin enregistré.</p>}
    <button className={buttonClass} disabled={uploading || mutation.isPending || !form.logo}>{uploading ? 'Envoi du logo…' : 'Enregistrer le magasin'}</button>
  </form>;
}

function VehicleForm({ vehicle, onDone, limitReached, onLimitConflict }: { vehicle?: RentalVehicle; onDone: () => void; limitReached: boolean; onLimitConflict: () => void }) {
  const [form, setForm] = useState<RentalVehicleInput>(vehicle ? { ...vehicle, photos: [...vehicle.photos] } : { ...emptyVehicle, photos: [] });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const mutation = useMutation({
    mutationFn: () => saveRentalVehicle(form, vehicle?.id), onSuccess: onDone,
    onError: (error) => { if (error instanceof ApiError && error.status === 409) onLimitConflict(); }
  });
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length + form.photos.length > 5) { setUploadError('Vous pouvez ajouter jusqu’à 5 photos.'); return; }
    setUploading(true); setUploadError('');
    try {
      for (const file of files) {
        const result = await uploadImage(file);
        setForm((current) => ({ ...current, photos: [...current.photos, result.url] }));
      }
    } catch (error) { setUploadError(errorText(error)); }
    finally { setUploading(false); }
  }
  return <form className={`${panelClass} space-y-4`} onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
    <h2 className="text-2xl text-white">{vehicle ? "Modifier le véhicule" : "Ajouter un véhicule"}</h2>
    <div className="grid gap-4 md:grid-cols-2">
      <label className="md:col-span-2">Titre<input required maxLength={180} className={fieldClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
      <label>Marque<input required maxLength={100} className={fieldClass} value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></label>
      <label>Modèle<input required maxLength={100} className={fieldClass} value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></label>
      <label>Année<input required type="number" min="1900" max="2100" className={fieldClass} value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} /></label>
      <label>Catégorie<select className={fieldClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option>Citadine</option><option>Berline</option><option>SUV</option><option>Utilitaire</option><option>Autre</option></select></label>
      <label>Prix par jour (DH)<input required type="number" min="0.01" max="9999999999.99" step="0.01" className={fieldClass} value={form.dailyPrice} onChange={(e) => setForm({ ...form, dailyPrice: Number(e.target.value) })} /></label>
      <label>Carburant<select className={fieldClass} value={form.fuel} onChange={(e) => setForm({ ...form, fuel: e.target.value })}><option>Diesel</option><option>Essence</option><option>Hybride</option><option>Électrique</option></select></label>
      <label>Boîte de vitesses<select className={fieldClass} value={form.transmission} onChange={(e) => setForm({ ...form, transmission: e.target.value })}><option>Manuelle</option><option>Automatique</option></select></label>
      <label>Statut<select className={fieldClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as RentalVehicleInput['status'] })}><option value="ACTIVE">Actif</option><option value="RENTED">Loué</option><option value="PAUSED">En pause</option></select></label>
      <label className="md:col-span-2">Photos (1 à 5, JPG, PNG ou WebP)<input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={uploading || form.photos.length >= 5} onChange={upload} className="mt-2 block w-full" /></label>
    </div>
    <div className="flex flex-wrap gap-3">{form.photos.map((photo, index) => <div key={`${photo}-${index}`}><img src={assetUrl(photo)} alt={`Photo ${index + 1}`} className="h-20 w-24 rounded object-cover" /><button type="button" className="text-sm text-ember" onClick={() => setForm({ ...form, photos: form.photos.filter((_, i) => i !== index) })}>Retirer</button></div>)}</div>
    {uploadError && <p role="alert" className="text-red-400">{uploadError}</p>}
    {mutation.isError && <p role="alert" className="text-red-400">{mutation.error instanceof ApiError && mutation.error.status === 409 ? 'Limite de véhicules atteinte. Contactez un administrateur.' : 'Enregistrement impossible. Vérifiez les informations et réessayez.'}</p>}
    <div className="flex gap-3"><button className={buttonClass} disabled={uploading || mutation.isPending || !form.photos.length || (!vehicle && limitReached)}>{uploading ? 'Envoi des photos…' : 'Enregistrer le véhicule'}</button>{vehicle && <button type="button" onClick={onDone} className="text-stone">Annuler</button>}</div>
  </form>;
}

export function RentalDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const client = useQueryClient();
  const [editing, setEditing] = useState<RentalVehicle | null>(null);
  const [formKey, setFormKey] = useState(0);
  const agency = useQuery({ queryKey: ['my-rental-agency', user?.email], queryFn: getMyRentalAgency, enabled: user?.role === 'AGENCY', retry: false });
  const vehicles = useQuery({ queryKey: ['my-rental-vehicles', user?.email], queryFn: getMyRentalVehicles, enabled: user?.role === 'AGENCY', retry: false });
  const quota = useQuery({ queryKey: ['my-rental-quota', user?.email], queryFn: getMyRentalQuota, enabled: user?.role === 'AGENCY', retry: false });
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ['my-rental-agency'] });
    void client.invalidateQueries({ queryKey: ['my-rental-vehicles'] });
    void client.invalidateQueries({ queryKey: ['my-rental-quota'] });
    void client.invalidateQueries({ queryKey: ['rentals'] });
    void client.invalidateQueries({ queryKey: ['rental-store'] });
    void client.invalidateQueries({ queryKey: ['rental-agencies'] });
  };
  const deletion = useMutation({ mutationFn: deleteRentalVehicle, onSuccess: (_, id) => {
    if (editing?.id === id) { setEditing(null); setFormKey((key) => key + 1); }
    refresh();
  } });
  if (user?.role !== 'AGENCY') return <p role="alert">Cet espace est réservé aux comptes inscrits comme agences de location.</p>;
  if (agency.isLoading) return <p>Chargement…</p>;
  if (agency.isError && !(agency.error instanceof ApiError && agency.error.status === 404)) return <p role="alert">Impossible de charger votre magasin.</p>;
  const finish = () => { setEditing(null); setFormKey((key) => key + 1); refresh(); };
  return <section className="space-y-6">
    <h1 className="font-display text-4xl uppercase text-white">Espace agence</h1>
    <AgencyForm agency={agency.data} onSaved={refresh} />
    {agency.data && <>
      <Link to={`/location/agence/${agency.data.id}`} className="inline-block text-ember">Voir ma vitrine publique</Link>
      {quota.isError ? <p role="alert">Impossible de charger votre plafond de véhicules. <button type="button" className="text-ember" onClick={() => void quota.refetch()}>Réessayer</button></p> : quota.data ? <>
        <p>Véhicules : {quota.data.count} / {quota.data.limit}. Les véhicules loués et en pause sont inclus. <button type="button" className="text-ember" onClick={() => void quota.refetch()}>Actualiser le plafond</button></p>
        {quota.data.count >= quota.data.limit && <p role="status">Votre limite est atteinte. Supprimez un véhicule ou contactez un administrateur pour l’augmenter.</p>}
        <VehicleForm key={editing?.id ?? `new-${formKey}`} vehicle={editing ?? undefined} onDone={finish}
          limitReached={quota.data.count >= quota.data.limit} onLimitConflict={refresh} />
      </> : <p>Chargement du plafond…</p>}
      <div className={panelClass}><h2 className="mb-4 text-2xl text-white">Mes véhicules</h2>
        {vehicles.isLoading ? <p>Chargement…</p> : vehicles.isError ? <p role="alert">Impossible de charger vos véhicules.</p> : !vehicles.data?.length ? <p>Aucun véhicule publié.</p> :
          <ul className="space-y-3">{vehicles.data.map((vehicle) => <li key={vehicle.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <span>{vehicle.title} · {price(vehicle.dailyPrice)} · {statusLabels[vehicle.status]}</span>
            <span className="flex gap-4"><button type="button" className="text-ember" onClick={() => setEditing(vehicle)}>Modifier</button><button type="button" disabled={deletion.isPending} className="text-red-400" onClick={() => { if (window.confirm(`Supprimer « ${vehicle.title} » ?`)) deletion.mutate(vehicle.id); }}>Supprimer</button></span>
          </li>)}</ul>}
        {deletion.isError && <p role="alert" className="mt-3 text-red-400">Suppression impossible. Réessayez.</p>}
      </div>
    </>}
  </section>;
}
