import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { assetUrl, deleteAdminUser, getAdminAgencies, setAdminUserEnabled, setAgencyVehicleLimit, type AdminAgency } from './services/api';

const panel = 'rounded-[24px] border border-white/10 bg-[#121416] p-5 sm:p-6';
const button = 'min-h-11 rounded-full border border-white/10 px-4 py-2 text-sm text-white disabled:opacity-50';
const labels = { ACTIVE: 'Actif', RENTED: 'Loué', PAUSED: 'En pause' };

function AgencyDetails({ agency, onBack }: { agency: AdminAgency; onBack: () => void }) {
  const client = useQueryClient();
  const [limit, setLimit] = useState(String(agency.vehicleLimit));
  const refresh = () => Promise.all([
    client.invalidateQueries({ queryKey: ['admin'] }),
    client.invalidateQueries({ queryKey: ['my-rental-quota'] }),
    client.invalidateQueries({ queryKey: ['rentals'] }),
    client.invalidateQueries({ queryKey: ['rental-store'] })
  ]);
  const limitMutation = useMutation({
    mutationFn: (value: number) => setAgencyVehicleLimit(agency.userId, value),
    onSuccess: refresh
  });
  const enabledMutation = useMutation({
    mutationFn: () => setAdminUserEnabled(agency.userId, !agency.enabled),
    onSuccess: refresh
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteAdminUser(agency.userId),
    onSuccess: async () => { await refresh(); onBack(); }
  });
  const handleLimit = (event: FormEvent) => {
    event.preventDefault();
    const value = Number(limit);
    if (!Number.isSafeInteger(value) || value < 1 || value > 2147483647) return;
    limitMutation.mutate(value);
  };
  return <article className={`${panel} space-y-5`}>
    <button type="button" onClick={onBack} className="text-ember">← Retour aux agences</button>
    <div className="flex items-center gap-4">
      {agency.store?.logo && <img src={assetUrl(agency.store.logo)} alt="" className="h-16 w-16 rounded-full object-cover" />}
      <div><h3 className="text-2xl text-white">{agency.store?.name ?? 'Magasin non configuré'}</h3>
        <p>{agency.firstName} {agency.lastName} · {agency.accountEmail}</p>
        <p>{agency.enabled ? 'Compte actif' : 'Compte suspendu'} · {agency.emailVerified ? 'E-mail vérifié' : 'E-mail non vérifié'}</p>
      </div>
    </div>
    <dl className="grid gap-3 text-sm sm:grid-cols-2">
      <div><dt>Contact du compte</dt><dd className="text-white">{agency.accountPhone || '—'}</dd></div>
      {agency.store && <>
        <div><dt>Contact de l’agence</dt><dd className="text-white">{agency.store.phone} · {agency.store.email}</dd></div>
        <div><dt>Adresse</dt><dd className="text-white">{agency.store.address}, {agency.store.city}</dd></div>
        <div><dt>Description</dt><dd className="whitespace-pre-wrap text-white">{agency.store.description}</dd></div>
      </>}
    </dl>
    {agency.store && agency.enabled && <Link className="inline-block text-ember" to={`/location/agence/${agency.store.id}`}>Voir la vitrine publique</Link>}
    <form onSubmit={handleLimit} className="space-y-2 border-t border-white/10 pt-5">
      <label className="block" htmlFor="agency-limit">Plafond de véhicules</label>
      <div className="flex flex-wrap gap-3"><input id="agency-limit" required type="number" min="1" max="2147483647" step="1" value={limit} onChange={(event) => setLimit(event.target.value)} className="w-32 rounded-xl border border-white/10 bg-[#0d0f10] p-3 text-white" />
        <button className={button} disabled={limitMutation.isPending}>Enregistrer le plafond</button></div>
      <p className="text-sm">Actuellement {agency.vehicles.length} / {agency.vehicleLimit} véhicules, tous statuts confondus. Réduire le plafond ne supprime aucun véhicule.</p>
      {limitMutation.isSuccess && <p role="status" className="text-emerald-400">Plafond enregistré.</p>}
      {limitMutation.isError && <p role="alert" className="text-red-400">Impossible d’enregistrer le plafond. Réessayez.</p>}
    </form>
    <div className="border-t border-white/10 pt-5"><h4 className="text-lg text-white">Véhicules ({agency.vehicles.length})</h4>
      {agency.vehicles.length === 0 ? <p className="mt-2">Aucun véhicule.</p> : <ul className="mt-2 space-y-2">{agency.vehicles.map((vehicle) => <li key={vehicle.id}>{vehicle.title} · {labels[vehicle.status]} · {new Intl.NumberFormat('fr-MA').format(vehicle.dailyPrice)} DH / jour</li>)}</ul>}
    </div>
    <div className="flex flex-wrap gap-3 border-t border-white/10 pt-5">
      <button type="button" className={button} disabled={enabledMutation.isPending} onClick={() => enabledMutation.mutate()}>{agency.enabled ? 'Suspendre le compte' : 'Réactiver le compte'}</button>
      <button type="button" className={`${button} border-red-500/40 text-red-400`} disabled={deleteMutation.isPending} onClick={() => {
        if (window.confirm(`Supprimer définitivement le compte de ${agency.firstName} ${agency.lastName} ? Son magasin et ses véhicules de location seront supprimés. Ses annonces de vente resteront sans propriétaire associé.`)) deleteMutation.mutate();
      }}>Supprimer le compte</button>
    </div>
    {(enabledMutation.isError || deleteMutation.isError) && <p role="alert" className="text-red-400">Action impossible. Réessayez.</p>}
  </article>;
}

export function AdminAgenciesTab() {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const query = useQuery({ queryKey: ['admin', 'agencies'], queryFn: getAdminAgencies });
  if (query.isLoading) return <p role="status">Chargement des agences…</p>;
  if (query.isError || !query.data) return <div role="alert">Impossible de charger les agences. <button type="button" className="text-ember" onClick={() => void query.refetch()}>Réessayer</button></div>;
  const selected = query.data.find((agency) => agency.userId === selectedId);
  const matching = query.data.filter((agency) => `${agency.store?.name ?? ''} ${agency.store?.city ?? ''} ${agency.store?.email ?? ''} ${agency.store?.phone ?? ''} ${agency.firstName} ${agency.lastName} ${agency.accountEmail} ${agency.accountPhone ?? ''}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  return <section className="space-y-4">
    <div className={panel}><h2 className="text-3xl text-white">Gestion des agences</h2><p>Consultez les magasins et gérez les comptes et les plafonds de véhicules.</p></div>
    {selectedId !== null ? selected ? <AgencyDetails key={selected.userId} agency={selected} onBack={() => setSelectedId(null)} /> : <div className={panel}><p role="alert">Ce compte agence n’existe plus.</p><button type="button" className="text-ember" onClick={() => setSelectedId(null)}>Retour aux agences</button></div> : <>
      <input className="w-full rounded-xl border border-white/10 bg-[#0d0f10] p-3 text-white" placeholder="Rechercher une agence, une ville ou un compte" aria-label="Rechercher une agence" value={search} onChange={(event) => setSearch(event.target.value)} />
      <div className={panel}><p className="mb-3">{matching.length} agence{matching.length === 1 ? '' : 's'}</p>
        <ul className="space-y-2">{matching.map((agency) => <li key={agency.userId}>
          <button type="button" onClick={() => setSelectedId(agency.userId)} className="w-full rounded-xl border border-white/10 p-4 text-left hover:bg-white/5">
            <span className="block font-medium text-white">{agency.store?.name ?? 'Magasin non configuré'} · {agency.store?.city ?? 'Ville non renseignée'}</span>
            <span className="block text-sm">{agency.firstName} {agency.lastName} · {agency.accountEmail} · {agency.enabled ? 'Actif' : 'Suspendu'} · {agency.vehicles.length} / {agency.vehicleLimit} véhicules</span>
          </button>
        </li>)}</ul>
        {!matching.length && <p>Aucune agence trouvée.</p>}
      </div>
    </>}
  </section>;
}
