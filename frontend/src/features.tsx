import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Check, Flag, Link2, MessageCircle, Share2, Star, Trash2 } from 'lucide-react';
import {
  assetUrl,
  deleteSellerReview,
  downloadAdminCsv,
  getAdminAnalytics,
  getAdminAudit,
  getAdminReports,
  getConversation,
  getConversations,
  getListing,
  getSellerReviews,
  recordListingEvent,
  reportListing,
  resolveAdminReport,
  saveSellerReview,
  sendMessage,
  startConversation,
  thumbUrl,
  type DayCount,
  type LabelCount
} from './services/api';
import { useAuthStore } from './store/authStore';
import { MAX_COMPARE, useCompareStore } from './store/compareStore';
import { LANGS, useLangStore, useT } from './lib/i18n';
import { coordsForCity, type Coords } from './lib/cities';

const card = 'rounded-3xl border border-white/10 bg-[#121416] p-5';
const input = 'w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-ember';
const primaryBtn = 'rounded-full bg-ember px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50';
const ghostBtn = 'rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-stone hover:text-white';

const firstImage = (value?: string | null) => {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed) && parsed.length) return String(parsed[0]);
  } catch {
    // valeur simple
  }
  return value;
};

const formatMoney = (value: number | string) =>
  `${new Intl.NumberFormat('fr-FR').format(Number(value))} MAD`;

export function LanguageSwitcher() {
  const { lang, setLang } = useLangStore();
  return (
    <div className="flex items-center rounded-full border border-white/10 bg-white/5 p-0.5" role="group" aria-label="Langue">
      {LANGS.map((item) => (
        <button
          key={item.code}
          type="button"
          onClick={() => setLang(item.code)}
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${lang === item.code ? 'bg-ember text-white' : 'text-stone hover:text-white'}`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function useDocumentDirection() {
  const lang = useLangStore((state) => state.lang);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-md rounded-3xl border border-white/10 bg-[#121416] p-6" onClick={(event) => event.stopPropagation()}>
        <h3 className="text-2xl uppercase text-white">{title}</h3>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export function ShareButtons({ listingId, title }: { listingId: number; title: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/listing/${listingId}`;
  const text = `${title} - SpeedShift`;

  const track = () => recordListingEvent(listingId, 'SHARE');
  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: text, url });
        track();
      } catch {
        // partage annulé
      }
    }
  };
  const copy = async () => {
    await navigator.clipboard?.writeText(url);
    setCopied(true);
    track();
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1 text-sm text-stone"><Share2 size={16} /> {t('Partager')}</span>
      {typeof navigator.share === 'function' && (
        <button type="button" onClick={nativeShare} className={ghostBtn}>{t('Partager')}</button>
      )}
      <a href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`} target="_blank" rel="noreferrer" onClick={track} className={ghostBtn}>WhatsApp</a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" onClick={track} className={ghostBtn}>Facebook</a>
      <button type="button" onClick={copy} className={ghostBtn}>
        {copied ? <span className="flex items-center gap-1"><Check size={14} /> {t('Lien copié')}</span> : <span className="flex items-center gap-1"><Link2 size={14} /> {t('Copier le lien')}</span>}
      </button>
    </div>
  );
}

const REPORT_REASONS: [string, string][] = [
  ['SCAM', 'Arnaque'],
  ['FAKE', 'Fausse annonce'],
  ['INAPPROPRIATE', 'Contenu inapproprié'],
  ['DUPLICATE', 'Doublon'],
  ['SOLD', 'Déjà vendu'],
  ['OTHER', 'Autre']
];

export function ReportButton({ listingId }: { listingId: number }) {
  const t = useT();
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('SCAM');
  const [details, setDetails] = useState('');
  const mutation = useMutation({ mutationFn: () => reportListing(listingId, reason, details) });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!mutation.isPending) mutation.mutate();
  };

  return (
    <>
      <button type="button" onClick={() => (user ? setOpen(true) : navigate('/login', { state: { from: `/listing/${listingId}` } }))} className="flex items-center gap-1 text-sm text-stone hover:text-white">
        <Flag size={14} /> {t('Signaler')}
      </button>
      {open && (
        <Modal title={t('Signaler cette annonce')} onClose={() => setOpen(false)}>
          {mutation.isSuccess ? (
            <div className="space-y-4">
              <p className="text-sm text-emerald-300">{t('Signalement envoyé, merci.')}</p>
              <button type="button" onClick={() => setOpen(false)} className={ghostBtn}>OK</button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <select value={reason} onChange={(event) => setReason(event.target.value)} className={input}>
                {REPORT_REASONS.map(([value, label]) => <option key={value} value={value}>{t(label)}</option>)}
              </select>
              <textarea value={details} onChange={(event) => setDetails(event.target.value)} maxLength={1000} rows={3} placeholder={t('Détails (optionnel)')} className={input} />
              {mutation.isError && <p className="text-sm text-red-300">Erreur</p>}
              <div className="flex gap-2">
                <button type="submit" disabled={mutation.isPending} className={primaryBtn}>{t('Envoyer le signalement')}</button>
                <button type="button" onClick={() => setOpen(false)} className={ghostBtn}>{t('Annuler')}</button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}

function Stars({ value, onChange }: { value: number; onChange?: (value: number) => void }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((index) => (
        <button key={index} type="button" disabled={!onChange} onClick={() => onChange?.(index)} aria-label={`${index}/5`} className="disabled:cursor-default">
          <Star size={onChange ? 22 : 16} className={index <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-stone/40'} />
        </button>
      ))}
    </span>
  );
}

export function SellerReviews({ sellerId }: { sellerId: number }) {
  const t = useT();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const { data } = useQuery({ queryKey: ['seller-reviews', sellerId, user?.email], queryFn: () => getSellerReviews(sellerId) });
  const refresh = (response: unknown) => queryClient.setQueryData(['seller-reviews', sellerId, user?.email], response);
  const save = useMutation({ mutationFn: () => saveSellerReview(sellerId, rating, comment), onSuccess: (response) => { refresh(response); setComment(''); } });
  const remove = useMutation({ mutationFn: () => deleteSellerReview(sellerId), onSuccess: refresh });

  return (
    <section className={card}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-2xl uppercase text-white">{t('Avis sur le vendeur')}</h3>
        {data?.average != null && (
          <div className="flex items-center gap-2 text-sm text-white"><Stars value={data.average} /> {data.average.toFixed(1)} ({data.count})</div>
        )}
      </div>
      <div className="mt-4 space-y-3">
        {data && data.reviews.length === 0 && <p className="text-sm text-stone">{t('Aucun avis pour le moment.')}</p>}
        {data?.reviews.map((review) => (
          <div key={review.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-white">{review.reviewerName}</span>
              <Stars value={review.rating} />
            </div>
            {review.comment && <p className="mt-1 text-sm text-stone">{review.comment}</p>}
            {review.mine && (
              <button type="button" onClick={() => remove.mutate()} disabled={remove.isPending} className="mt-2 flex items-center gap-1 text-xs text-red-300">
                <Trash2 size={12} /> {t('Supprimer mon avis')}
              </button>
            )}
          </div>
        ))}
      </div>
      {user ? (
        <form onSubmit={(event) => { event.preventDefault(); if (!save.isPending) save.mutate(); }} className="mt-4 space-y-3">
          <div className="text-sm text-white">{t('Laisser un avis')}</div>
          <Stars value={rating} onChange={setRating} />
          <textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={1000} rows={2} placeholder={t('Votre commentaire')} className={input} />
          {save.isError && <p className="text-sm text-red-300">Erreur</p>}
          <button type="submit" disabled={save.isPending} className={primaryBtn}>{t('Publier l\'avis')}</button>
        </form>
      ) : (
        <p className="mt-4 text-sm text-stone"><Link to="/login" className="text-ember">{t('Connectez-vous pour laisser un avis.')}</Link></p>
      )}
    </section>
  );
}

export function ContactSellerButton({ listingId }: { listingId: number }) {
  const t = useT();
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState('');
  const mutation = useMutation({
    mutationFn: () => startConversation(listingId, body),
    onSuccess: (detail) => navigate(`/messages/${detail.conversation.id}`)
  });

  return (
    <>
      <button type="button" onClick={() => (user ? setOpen(true) : navigate('/login', { state: { from: `/listing/${listingId}` } }))} className={`${ghostBtn} flex items-center gap-2`}>
        <MessageCircle size={16} /> {t('Envoyer un message')}
      </button>
      {open && (
        <Modal title={t('Envoyer un message')} onClose={() => setOpen(false)}>
          <form onSubmit={(event) => { event.preventDefault(); if (body.trim() && !mutation.isPending) mutation.mutate(); }} className="space-y-3">
            <textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={2000} rows={4} placeholder={t('Votre message')} className={input} autoFocus />
            {mutation.isError && <p className="text-sm text-red-300">Erreur</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={mutation.isPending || !body.trim()} className={primaryBtn}>{t('Envoyer')}</button>
              <button type="button" onClick={() => setOpen(false)} className={ghostBtn}>{t('Annuler')}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

export function CompareToggle({ listingId, className = '' }: { listingId: number; className?: string }) {
  const t = useT();
  const { ids, toggle } = useCompareStore();
  const active = ids.includes(listingId);
  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!toggle(listingId)) window.alert(t('Maximum 3 annonces dans le comparateur.'));
      }}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1 text-xs ${active ? 'border-ember bg-ember text-white' : 'border-white/10 bg-black/40 text-white'} ${className}`}
    >
      {active ? <span className="flex items-center gap-1"><Check size={12} /> {t('Comparer')}</span> : t('Comparer')}
    </button>
  );
}

export function CompareBar() {
  const t = useT();
  const { ids, clear } = useCompareStore();
  if (ids.length === 0) return null;
  return (
    <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/10 bg-[#121416] px-5 py-3 shadow-soft">
      <span className="text-sm text-white">{t('Comparateur')} ({ids.length}/{MAX_COMPARE})</span>
      <Link to="/compare" className={primaryBtn}>{t('Comparer')}</Link>
      <button type="button" onClick={clear} className="text-xs text-stone hover:text-white">{t('Vider')}</button>
    </div>
  );
}

export function ComparePage() {
  const t = useT();
  const { ids, remove } = useCompareStore();
  const query = useQuery({
    queryKey: ['compare', ids],
    queryFn: () => Promise.all(ids.map((id) => getListing(id).catch(() => null)))
  });
  const items = (query.data ?? []).filter(Boolean) as any[];

  const rows: [string, (item: any) => ReactNode][] = [
    ['Prix', (item) => formatMoney(item.price)],
    ['Catégorie', (item) => item.category],
    ['Ville', (item) => item.city ?? '-'],
    ['Année', (item) => item.year ?? '-'],
    ['Kilométrage', (item) => (item.mileage != null ? `${new Intl.NumberFormat('fr-FR').format(item.mileage)} km` : '-')],
    ['Carburant', (item) => item.fuel ?? '-'],
    ['Boîte', (item) => item.transmission ?? '-']
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-5xl uppercase text-white">{t('Comparer les annonces')}</h1>
      {ids.length === 0 ? (
        <p className="text-stone">{t('Ajoutez jusqu\'à 3 annonces pour les comparer.')} <Link to="/catalog" className="text-ember">Market</Link></p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-3 text-sm">
            <thead>
              <tr>
                <th />
                {items.map((item) => (
                  <th key={item.id} className="align-top text-left font-normal">
                    <div className={card}>
                      {firstImage(item.imageUrl) && <img src={thumbUrl(assetUrl(firstImage(item.imageUrl)!))} alt="" className="mb-3 h-32 w-full rounded-2xl object-cover" />}
                      <Link to={`/listing/${item.id}`} className="font-display text-xl uppercase text-white">{item.title}</Link>
                      <button type="button" onClick={() => remove(item.id)} className="mt-2 block text-xs text-red-300">{t('Retirer')}</button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, render]) => (
                <tr key={label}>
                  <td className="whitespace-nowrap text-stone">{t(label)}</td>
                  {items.map((item) => <td key={item.id} className="rounded-2xl border border-white/10 bg-[#121416] px-4 py-3 text-white">{render(item)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function useUnreadCount(enabled: boolean) {
  return useQuery({
    queryKey: ['unread-count'],
    queryFn: async () => (await import('./services/api')).getUnreadCount(),
    enabled,
    refetchInterval: 30000
  });
}

export function MessagesPage() {
  const t = useT();
  const { data } = useQuery({ queryKey: ['conversations'], queryFn: getConversations, refetchInterval: 10000 });
  return (
    <div className="space-y-6">
      <h1 className="text-5xl uppercase text-white">{t('Messages')}</h1>
      {data && data.length === 0 && <p className="text-stone">{t('Aucune conversation.')}</p>}
      <div className="space-y-3">
        {data?.map((conversation) => (
          <Link key={conversation.id} to={`/messages/${conversation.id}`} className={`${card} block hover:border-ember`}>
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-white">{conversation.otherUserName}</span>
              {conversation.unreadCount > 0 && <span className="rounded-full bg-ember px-2 py-0.5 text-xs text-white">{conversation.unreadCount}</span>}
            </div>
            <div className="text-xs text-stone">{conversation.listingTitle}</div>
            <p className="mt-1 truncate text-sm text-stone">{conversation.lastMessage}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function MessageThreadPage() {
  const t = useT();
  const id = Number(useParams().id);
  const queryClient = useQueryClient();
  const [body, setBody] = useState('');
  const bottom = useRef<HTMLDivElement>(null);
  const { data } = useQuery({ queryKey: ['conversation', id], queryFn: () => getConversation(id), refetchInterval: 5000, enabled: Number.isFinite(id) });
  const send = useMutation({
    mutationFn: () => sendMessage(id, body),
    onSuccess: (detail) => {
      setBody('');
      queryClient.setQueryData(['conversation', id], detail);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' });
    queryClient.invalidateQueries({ queryKey: ['unread-count'] });
  }, [data?.messages.length, queryClient]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link to="/messages" className="text-sm text-stone hover:text-white">← {t('Retour')}</Link>
      {data && (
        <div>
          <h1 className="text-4xl uppercase text-white">{data.conversation.otherUserName}</h1>
          <Link to={`/listing/${data.conversation.listingId}`} className="text-sm text-ember">{data.conversation.listingTitle}</Link>
        </div>
      )}
      <div className={`${card} flex max-h-[50vh] min-h-[240px] flex-col gap-2 overflow-y-auto`}>
        {data?.messages.map((message) => (
          <div key={message.id} className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2 text-sm ${message.mine ? 'self-end bg-ember text-white' : 'self-start bg-white/10 text-white'}`}>
            {message.body}
          </div>
        ))}
        <div ref={bottom} />
      </div>
      <form onSubmit={(event) => { event.preventDefault(); if (body.trim() && !send.isPending) send.mutate(); }} className="flex gap-2">
        <input value={body} onChange={(event) => setBody(event.target.value)} maxLength={2000} placeholder={t('Écrivez un message…')} className={input} />
        <button type="submit" disabled={send.isPending || !body.trim()} className={primaryBtn}>{t('Envoyer')}</button>
      </form>
    </div>
  );
}

const markerIcon = L.divIcon({
  className: '',
  html: '<div style="width:18px;height:18px;border-radius:50%;background:#D94A2B;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

export function CityMap({ listings, height = 420 }: { listings: any[]; height?: number }) {
  const groups = useMemo(() => {
    const byCity = new Map<string, { coords: Coords; items: any[] }>();
    listings.forEach((listing) => {
      const coords = coordsForCity(listing.city);
      if (!coords) return;
      const key = String(listing.city).trim().toLowerCase();
      const entry = byCity.get(key) ?? { coords, items: [] };
      entry.items.push(listing);
      byCity.set(key, entry);
    });
    return [...byCity.values()];
  }, [listings]);

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10" style={{ height }}>
      <MapContainer center={[31.8, -7.1]} zoom={5} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {groups.map((group) => (
          <Marker key={`${group.coords.lat}-${group.coords.lng}`} position={[group.coords.lat, group.coords.lng]} icon={markerIcon}>
            <Popup>
              <div className="space-y-1 text-sm">
                <strong>{group.items[0].city} ({group.items.length})</strong>
                {group.items.slice(0, 5).map((item) => (
                  <div key={item.id}><Link to={`/listing/${item.id}`}>{item.title}</Link></div>
                ))}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export function ListingLocationMap({ city }: { city?: string | null }) {
  const coords = coordsForCity(city);
  if (!coords) return null;
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10" style={{ height: 220 }}>
      <MapContainer center={[coords.lat, coords.lng]} zoom={11} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[coords.lat, coords.lng]} icon={markerIcon} />
      </MapContainer>
    </div>
  );
}

function BarChart({ title, data }: { title: string; data: DayCount[] }) {
  const max = Math.max(1, ...data.map((item) => item.count));
  return (
    <div className={card}>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-xl uppercase text-white">{title}</h4>
        <span className="text-sm text-stone">{data.reduce((sum, item) => sum + item.count, 0)}</span>
      </div>
      <div className="flex h-32 items-end gap-0.5">
        {data.map((item) => (
          <div key={item.date} title={`${item.date}: ${item.count}`} className="flex-1 rounded-t bg-ember/80" style={{ height: `${Math.max(2, (item.count / max) * 100)}%` }} />
        ))}
      </div>
    </div>
  );
}

function Distribution({ title, data }: { title: string; data: LabelCount[] }) {
  const max = Math.max(1, ...data.map((item) => item.count));
  return (
    <div className={card}>
      <h4 className="mb-3 text-xl uppercase text-white">{title}</h4>
      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.label} className="text-sm">
            <div className="flex justify-between text-stone"><span>{item.label}</span><span>{item.count}</span></div>
            <div className="mt-1 h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-ember" style={{ width: `${(item.count / max) * 100}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminAnalyticsTab() {
  const t = useT();
  const { data } = useQuery({ queryKey: ['admin-analytics'], queryFn: () => getAdminAnalytics(30) });
  if (!data) return null;
  const totals: [string, number][] = [
    ['Vues', data.totalViews],
    ['Contacts', data.totalContacts],
    ['Signalements', data.openReports],
    ['Messages', data.totalConversations]
  ];
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        {totals.map(([label, value]) => (
          <div key={label} className={card}><div className="text-xs uppercase text-stone">{t(label)}</div><div className="font-display text-4xl text-white">{value}</div></div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <BarChart title="Annonces / jour" data={data.listingsByDay} />
        <BarChart title="Inscriptions / jour" data={data.usersByDay} />
        <BarChart title={`${t('Vues')} / jour`} data={data.viewsByDay} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Distribution title={t('Catégorie')} data={data.listingsByCategory} />
        <Distribution title="Statut" data={data.listingsByStatus} />
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => downloadAdminCsv('users')} className={ghostBtn}>{t('Exporter les utilisateurs (CSV)')}</button>
        <button type="button" onClick={() => downloadAdminCsv('listings')} className={ghostBtn}>{t('Exporter les annonces (CSV)')}</button>
      </div>
    </div>
  );
}

export function AdminReportsTab() {
  const t = useT();
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ['admin-reports'], queryFn: getAdminReports });
  const resolve = useMutation({
    mutationFn: (args: { id: number; status: 'RESOLVED' | 'DISMISSED'; archive: boolean }) => resolveAdminReport(args.id, args.status, args.archive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
    }
  });
  if (!data) return null;
  if (data.length === 0) return <p className="text-stone">{t('Aucun signalement.')}</p>;
  return (
    <div className="space-y-3">
      {data.map((report) => (
        <div key={report.id} className={card}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link to={`/listing/${report.listingId}`} className="font-medium text-white hover:text-ember">{report.listingTitle}</Link>
            <span className={`rounded-full px-3 py-1 text-xs ${report.status === 'OPEN' ? 'bg-ember/20 text-ember' : 'bg-white/10 text-stone'}`}>{report.status}</span>
          </div>
          <div className="mt-1 text-sm text-stone">{report.reason}{report.details ? ` — ${report.details}` : ''}</div>
          <div className="text-xs text-stone/70">{report.reporterEmail} · {new Date(report.createdAt).toLocaleString()}</div>
          {report.status === 'OPEN' && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" disabled={resolve.isPending} onClick={() => resolve.mutate({ id: report.id, status: 'RESOLVED', archive: false })} className={ghostBtn}>{t('Résoudre')}</button>
              <button type="button" disabled={resolve.isPending} onClick={() => resolve.mutate({ id: report.id, status: 'DISMISSED', archive: false })} className={ghostBtn}>{t('Rejeter')}</button>
              <button type="button" disabled={resolve.isPending} onClick={() => resolve.mutate({ id: report.id, status: 'RESOLVED', archive: true })} className={ghostBtn}>{t('Archiver l\'annonce')}</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function AdminAuditTab() {
  const t = useT();
  const { data } = useQuery({ queryKey: ['admin-audit'], queryFn: getAdminAudit });
  if (!data) return null;
  if (data.length === 0) return <p className="text-stone">{t('Aucune entrée.')}</p>;
  return (
    <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#121416]">
      <table className="w-full min-w-[600px] text-left text-sm">
        <thead className="text-xs uppercase text-stone"><tr><th className="p-3">Date</th><th className="p-3">Admin</th><th className="p-3">Action</th><th className="p-3">Cible</th><th className="p-3">Détails</th></tr></thead>
        <tbody>
          {data.map((entry) => (
            <tr key={entry.id} className="border-t border-white/5 text-stone">
              <td className="whitespace-nowrap p-3">{new Date(entry.createdAt).toLocaleString()}</td>
              <td className="p-3">{entry.adminEmail}</td>
              <td className="p-3 text-white">{entry.action}</td>
              <td className="p-3">{entry.targetType} {entry.targetId ?? ''}</td>
              <td className="p-3">{entry.details}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
