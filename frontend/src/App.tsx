import { type FormEvent, type ReactNode, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CarFront,
  ChevronRight,
  Gauge,
  MapPin,
  Menu,
  Search,
  ShieldCheck,
  Star,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';
import { Link, Navigate, NavLink, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { createListing, getHome, getListing, getListings, getPendingListings, loginUser, publishListing, registerUser, type CreateListingPayload } from './services/api';
import { useAuthStore } from './store/authStore';

const formatPrice = (value: number | string) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Number(value));

const appNavItems = [
  { label: 'Marketplace', to: '/marketplace' },
  { label: 'Catalogue', to: '/catalog' },
  { label: 'Publier une annonce', to: '/sell' }
];

function App() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="min-h-screen bg-carbon text-stone">
      <Header />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/marketplace" element={<RequireAuth><MarketplacePage /></RequireAuth>} />
          <Route path="/catalog" element={<RequireAuth><CatalogPage /></RequireAuth>} />
          <Route path="/listing/:id" element={<RequireAuth><ListingDetailPage /></RequireAuth>} />
          <Route path="/sell" element={<RequireAuth><SellPage /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth adminOnly><AdminPage /></RequireAuth>} />
          <Route path="*" element={<Navigate to={user ? '/marketplace' : '/'} replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function RequireAuth({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (adminOnly && user.role !== 'ADMIN') {
    return <Navigate to="/marketplace" replace />;
  }
  return <>{children}</>;
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navItems = user
    ? [...appNavItems, ...(user.role === 'ADMIN' ? [{ label: 'Administration', to: '/admin' }] : [])]
    : [];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-carbon/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-ember text-lg font-bold text-white">S</div>
          <div>
            <div className="font-display text-3xl uppercase leading-none text-white">SpeedShift</div>
            <div className="text-[10px] uppercase tracking-[0.32em] text-stone">Marketplace</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          <NavLink to="/" className={({ isActive }) => `text-sm uppercase tracking-[0.18em] transition ${isActive ? 'text-white' : 'text-stone hover:text-white'}`}>
            Accueil
          </NavLink>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `text-sm uppercase tracking-[0.18em] transition ${isActive ? 'text-white' : 'text-stone hover:text-white'}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/marketplace" className="rounded-full border border-ember/60 bg-ember/10 px-4 py-2 text-sm font-medium text-white">Accéder à l’app</Link>
              <span className="text-sm text-white">{user.firstName}</span>
              <button onClick={logout} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white">Déconnexion</button>
            </div>
          ) : (
            <Link to="/login" className="rounded-full border border-ember/60 bg-ember/10 px-4 py-2 text-sm font-medium text-white">Login</Link>
          )}
        </div>

        <button className="rounded-full border border-white/10 p-2 md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          <Menu size={18} />
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="border-t border-white/10 bg-carbon md:hidden">
            <div className="flex max-w-7xl flex-col gap-3 px-4 py-4">
              <NavLink to="/" className="text-sm uppercase tracking-[0.2em] text-stone" onClick={() => setMenuOpen(false)}>Accueil</NavLink>
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} className="text-sm uppercase tracking-[0.2em] text-stone" onClick={() => setMenuOpen(false)}>
                  {item.label}
                </NavLink>
              ))}
              {user ? (
                <button onClick={() => { logout(); setMenuOpen(false); }} className="self-start text-sm uppercase tracking-[0.2em] text-stone">Déconnexion</button>
              ) : (
                <NavLink to="/login" className="text-sm uppercase tracking-[0.2em] text-stone" onClick={() => setMenuOpen(false)}>Login</NavLink>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0a0b0d]">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 text-sm text-stone sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <div className="font-display text-3xl uppercase text-white">SpeedShift</div>
          <p className="mt-2 max-w-md text-stone/80">Marketplace premium pour les passionnés de deux-roues, voitures et machines sportives.</p>
        </div>
        <div className="flex gap-6">
          <span>À propos</span>
          <span>Conseils anti-arnaque</span>
          <span>Contact</span>
        </div>
      </div>
    </footer>
  );
}

function LandingPage() {
  const user = useAuthStore((state) => state.user);
  const pillars = [
    {
      icon: <Search size={22} />,
      title: 'Recherche précise',
      text: 'Filtre par budget, ville, année, puissance et usage pour trouver exactement ce qu’il faut.'
    },
    {
      icon: <ShieldCheck size={22} />,
      title: 'Vente transparente',
      text: 'Profil vérifié, annonces contrôlées et échange sécurisé entre acheteurs et vendeurs.'
    },
    {
      icon: <TrendingUp size={22} />,
      title: 'Marché vivant',
      text: 'Annonces récentes, tendances prix, bonnes affaires et inventaire d’exception.'
    }
  ];

  const categories = [
    ['Motos', 'Sport, roadster, trail et occasion.'],
    ['Voitures', 'Premium, sportives et utilitaires.'],
    ['Jet-skis', 'Plage, lac, sensations et maintenance.'],
    ['Quads', 'Terrain, loisirs et performance.']
  ];

  return (
    <div className="space-y-16 pb-8">
      <section className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[#121416]">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-ember/10 blur-3xl" />
        <div className="relative grid gap-8 p-6 md:p-10 lg:grid-cols-[1.25fr_0.75fr] lg:p-14">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-stone">
              <Zap size={14} className="text-ember" />
              Marketplace premium pour passionnés de moteur
            </div>

            <div className="max-w-2xl space-y-5">
              <h1 className="font-display text-6xl uppercase leading-[0.9] text-white md:text-7xl">
                Acheter et vendre les machines <span className="text-ember">qui font battre le cœur.</span>
              </h1>
              <p className="max-w-xl text-base text-stone/80 md:text-lg">
                SpeedShift rassemble motos, voitures, jet-skis, quads et pièces premium dans une expérience claire, rapide et crédible.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to={user ? '/marketplace' : '/login'} className="rounded-full bg-ember px-5 py-3 text-sm font-medium text-white transition hover:bg-[#f06d4b]">
                {user ? 'Accéder au marché' : 'Se connecter pour accéder au marché'}
              </Link>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              {[
                { label: 'Annonces actives', value: '1.8k+' },
                { label: 'Ventes validées', value: '94%' },
                { label: 'Villes couvertes', value: '34' }
              ].map((card) => (
                <div key={card.label} className="rounded-2xl border border-white/10 bg-[#0d0f10] px-4 py-3">
                  <div className="font-display text-3xl uppercase text-white">{card.value}</div>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-stone/80">{card.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-end">
            <div className="rounded-[28px] border border-white/10 bg-[#0d0f10] p-5 shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.3em] text-stone/80">Présentation</span>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-emerald-300">Live</span>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-stone">Moto / voiture / jet-ski / quad</div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-stone">Recherche avancée par budget, ville et moteur</div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-stone">Vérification vendeur et annonces premium</div>
                {user && <Link to="/marketplace" className="block w-full rounded-xl bg-ember px-4 py-3 text-center text-sm font-medium text-white">Voir la marketplace</Link>}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl border border-white/10 bg-[#15181b] p-3">
                  <div className="font-display text-3xl uppercase text-white">+500</div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-stone/70">Véhicules</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#15181b] p-3">
                  <div className="font-display text-3xl uppercase text-white">24h</div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-stone/70">Mise en ligne</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {pillars.map((item) => (
          <div key={item.title} className="rounded-[26px] border border-white/10 bg-[#121416] p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-ember">
              {item.icon}
            </div>
            <h2 className="font-display text-4xl uppercase text-white">{item.title}</h2>
            <p className="mt-3 text-stone/80">{item.text}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[30px] border border-white/10 bg-[#121416] p-6 md:p-8">
          <div className="text-[10px] uppercase tracking-[0.28em] text-ember">Le salon de la mécanique</div>
          <h2 className="mt-3 max-w-md font-display text-5xl uppercase text-white">Une plateforme pensée comme un lieu de rencontre, pas juste un tableau.</h2>
          <p className="mt-4 max-w-xl text-stone/75">
            Entre acheteurs exigeants et vendeurs sérieux, SpeedShift crée un espace premium où l’information est claire, la transaction sécurisée et la passion du moteur toujours au centre.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-[#0d0f10] p-4">
              <div className="mb-2 flex items-center gap-2 text-ember"><Users size={16} /> Vendeurs vérifiés</div>
              <p className="text-sm text-stone/75">Des profils sérieux, un contrôle de qualité et une meilleure confiance.</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-[#0d0f10] p-4">
              <div className="mb-2 flex items-center gap-2 text-ember"><MapPin size={16} /> Localisation réelle</div>
              <p className="text-sm text-stone/75">Une recherche par ville, rayon et catégorie pour aller à l’essentiel.</p>
            </div>
          </div>
        </div>

        <div className="rounded-[30px] border border-white/10 bg-[#0d0f10] p-5">
          <div className="rounded-[24px] border border-white/10 bg-[#121416] p-5">
            <div className="mb-4 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-stone/70">
              <span>Évolution du marché</span>
              <span className="text-emerald-400">+12.4%</span>
            </div>
            <div className="space-y-3">
              {[68, 82, 74, 92, 98].map((h, idx) => (
                <div key={h} className="flex items-center gap-3">
                  <span className="w-10 text-[10px] uppercase tracking-[0.2em] text-stone/60">{['M','V','J','Q'][idx]}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-ember" style={{ width: `${h}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-white/10 bg-[#121416] p-6 md:p-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-ember">Catégories</div>
            <h2 className="mt-2 text-4xl uppercase text-white">La bonne machine dans la bonne catégorie</h2>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-4">
          {categories.map(([label, value]) => (
            <div key={label} className="rounded-[24px] border border-white/10 bg-[#0d0f10] p-4">
              <div className="font-display text-3xl uppercase text-white">{label}</div>
              <p className="mt-2 text-sm text-stone/80">{value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function MarketplacePage() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['home'], queryFn: getHome });
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [query, setQuery] = useState('');

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (query.trim()) params.set('query', query.trim());
    navigate(`/catalog${params.size ? `?${params.toString()}` : ''}`);
  };

  if (isLoading || !data) {
    if (isError) return <ErrorPanel />;
    return <LoadingPanel />;
  }

  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#121416]">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="relative grid gap-8 p-6 md:p-10 lg:grid-cols-[1.2fr_0.8fr] lg:p-14">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-stone">
              <Zap size={14} className="text-ember" />
              Marché premium 100% moteur
            </div>
            <div className="max-w-2xl space-y-5">
              <h1 className="font-display text-6xl uppercase leading-[0.9] text-white md:text-7xl">
                Trouvez la machine <span className="text-ember">qui vous ressemble.</span>
              </h1>
              <p className="max-w-lg text-base text-stone/80 md:text-lg">
                Motos, voitures, jet-skis et quads — une marketplace dédiée aux passionnés, pensée pour la recherche rapide et la confiance.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/catalog" className="rounded-full bg-ember px-5 py-3 text-sm font-medium text-white transition hover:bg-[#f06d4b]">Voir les annonces</Link>
              <Link to="/sell" className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white">Vendre</Link>
            </div>
          </div>

          <div className="flex flex-col justify-end">
            <div className="rounded-[28px] border border-white/10 bg-[#0d0f10] p-4 shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.3em] text-stone/80">Recherche rapide</span>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-emerald-300">Live</span>
              </div>
              <form onSubmit={submitSearch} className="space-y-3">
                <select value={category} onChange={(event) => setCategory(event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#121416] p-3 text-sm text-white">
                  <option value="">Toutes les catégories</option>
                  {data.categories.map((item: any) => <option key={item.name} value={item.name}>{item.name}</option>)}
                </select>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom, marque ou modèle" className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-stone/60" />
                <button type="submit" className="w-full rounded-xl bg-ember px-4 py-3 text-sm font-medium text-white">Lancer la recherche</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-ember">Catégories</div>
            <h2 className="mt-2 text-4xl uppercase text-white">Explorer la grille</h2>
          </div>
          <Link to="/catalog" className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-stone hover:text-white">Découvrir <ChevronRight size={15} /></Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {data.categories.map((category: any) => (
            <Link key={category.name} to={`/catalog?category=${encodeURIComponent(category.name)}`} className="group rounded-[24px] border border-white/10 bg-[#121416] p-4 transition hover:border-ember/40 hover:bg-[#16191c]">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-ember">
                {category.name.includes('Moto') ? <CarFront size={20} /> : category.name.includes('Voiture') ? <Gauge size={20} /> : <MapPin size={20} />}
              </div>
              <div className="font-display text-3xl uppercase text-white">{category.name}</div>
              <div className="mt-2 flex items-center justify-between text-sm text-stone/80">
                <span>{category.count} annonces</span>
                <span className="text-ember">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-ember">À la une</div>
            <h2 className="mt-2 text-4xl uppercase text-white">Offres en vedette</h2>
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-4">
          {data.featured.map((item: any) => (
            <ListingCard key={item.id} listing={item} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-ember">Nouveautés</div>
            <h2 className="mt-2 text-4xl uppercase text-white">Dernières annonces</h2>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {data.latest.map((item: any) => (
            <ListingCard key={item.id} listing={item} compact />
          ))}
        </div>
      </section>
    </div>
  );
}

function ListingCard({ listing, compact = false }: { listing: any; compact?: boolean }) {
  return (
    <Link to={`/listing/${listing.id}`} className={`group block overflow-hidden rounded-[24px] border border-white/10 bg-[#121416] transition hover:border-ember/40 ${compact ? 'h-full' : ''}`}>
      <div className="relative overflow-hidden">
        <img src={listing.imageUrl} alt={listing.title} className="h-56 w-full object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-white">
          <Star size={10} className="fill-current text-yellow-400" />
          {listing.sellerRating ?? '4.8'}
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-display text-3xl uppercase text-white">{formatPrice(listing.price)}</div>
            <h3 className="mt-1 text-xl uppercase text-stone">{listing.title}</h3>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-stone">{listing.year}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-stone/80">
          <MapPin size={14} />
          {listing.city}
        </div>
        <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs uppercase tracking-[0.2em] text-stone/70">
          <span>{listing.brand}</span>
          <span>{listing.mileage ? `${listing.mileage.toLocaleString()} km` : '0 km'}</span>
        </div>
      </div>
    </Link>
  );
}

function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') ?? undefined;
  const [query, setQuery] = useState(searchParams.get('query') ?? '');
  const [city, setCity] = useState(searchParams.get('city') ?? '');
  const [sort, setSort] = useState('featured');

  const { data, isLoading } = useQuery({
    queryKey: ['listings', { category, query, city, sort }],
    queryFn: () => getListings(category, city, query, sort)
  });

  if (isLoading || !data) {
    if (!isLoading) return <ErrorPanel />;
    return <LoadingPanel />;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[26px] border border-white/10 bg-[#121416] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-ember">Recherche</div>
            <h1 className="mt-2 font-display text-5xl uppercase text-white">Catalogue</h1>
          </div>
          <div className="flex w-full max-w-xl items-center gap-2 rounded-full border border-white/10 bg-black/20 p-2">
            <Search size={16} className="ml-2 text-stone" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') setSearchParams((previous) => { const next = new URLSearchParams(previous); query.trim() ? next.set('query', query.trim()) : next.delete('query'); return next; }); }} placeholder="Nom, marque ou modèle…" className="w-full bg-transparent text-sm text-white placeholder:text-stone/60 focus:outline-none" />
            <button type="button" onClick={() => setSearchParams((previous) => { const next = new URLSearchParams(previous); query.trim() ? next.set('query', query.trim()) : next.delete('query'); return next; })} className="rounded-full bg-ember px-4 py-2 text-xs uppercase tracking-[0.2em] text-white">GO</button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-[26px] border border-white/10 bg-[#121416] p-5">
          <div className="mb-4 text-[10px] uppercase tracking-[0.3em] text-ember">Filtres</div>
          <div className="space-y-4 text-sm text-stone">
            <label className="block space-y-2">
              <span>Catégorie</span>
              <select value={category ?? ''} onChange={(event) => setSearchParams((previous) => { const next = new URLSearchParams(previous); event.target.value ? next.set('category', event.target.value) : next.delete('category'); return next; })} className="w-full rounded-xl border border-white/10 bg-[#0b0c0e] p-3 text-white">
                <option value="">Toutes</option>
                {['Motos', 'Voitures', 'Jet Skis', 'Quads', 'Pièces & Accessoires'].map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="block space-y-2">
              <span>Ville</span>
              <input value={city} onChange={(event) => setCity(event.target.value)} onBlur={() => setSearchParams((previous) => { const next = new URLSearchParams(previous); city.trim() ? next.set('city', city.trim()) : next.delete('city'); return next; })} onKeyDown={(event) => { if (event.key === 'Enter') setSearchParams((previous) => { const next = new URLSearchParams(previous); city.trim() ? next.set('city', city.trim()) : next.delete('city'); return next; }); }} placeholder="Ex. Paris" className="w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white placeholder:text-stone/60" />
            </label>
          </div>
        </aside>

        <div className="space-y-5">
          <div className="flex items-center justify-between rounded-[24px] border border-white/10 bg-[#121416] px-4 py-3">
            <div className="text-sm text-stone/80">{data.length} résultats</div>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-full border border-white/10 bg-[#0b0c0e] px-3 py-2 text-sm text-white">
              <option value="featured">À la une</option>
              <option value="price_asc">Prix ↑</option>
              <option value="price_desc">Prix ↓</option>
              <option value="newest">Nouveautés</option>
              <option value="popular">Populaires</option>
            </select>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {data.map((item: any) => (
              <ListingCard key={item.id} listing={item} compact />
            ))}
          </div>
          {data.length === 0 && <div className="rounded-[24px] border border-white/10 bg-[#121416] p-8 text-center text-stone">Aucune annonce ne correspond à votre recherche.</div>}
        </div>
      </section>
    </div>
  );
}

function ListingDetailPage() {
  const { id } = useParams();
  const { data, isLoading, isError } = useQuery({ queryKey: ['listing', id], queryFn: () => getListing(Number(id)) });

  if (isLoading || !data) {
    if (isError) return <ErrorPanel />;
    return <LoadingPanel />;
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[#121416]">
        <img src={data.imageUrl} alt={data.title} className="h-[460px] w-full object-cover" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-6 rounded-[28px] border border-white/10 bg-[#121416] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.26em] text-ember">{data.category}</div>
              <h1 className="mt-2 text-5xl uppercase text-white">{data.title}</h1>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-stone">{data.status}</div>
          </div>

          <div className="flex items-center gap-6 text-sm text-stone/80">
            <span className="flex items-center gap-2"><MapPin size={16} /> {data.city}</span>
            <span>{data.year}</span>
            <span>{data.mileage == null ? '—' : `${data.mileage.toLocaleString()} km`}</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Object.entries(data.specs).map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-[#0d0f10] p-3">
                <div className="text-[10px] uppercase tracking-[0.22em] text-stone/70">{label}</div>
                <div className="mt-2 text-lg text-white">{String(value)}</div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h3 className="font-display text-3xl uppercase text-white">Description</h3>
            <p className="max-w-3xl text-stone/85">{data.description}</p>
          </div>

          <div>
            <h3 className="font-display text-3xl uppercase text-white">Équipements</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.features.map((feature: string) => (
                <span key={feature} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.2em] text-stone">{feature}</span>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-5 rounded-[28px] border border-white/10 bg-[#121416] p-6">
          <div className="font-display text-5xl uppercase text-ember">{formatPrice(data.price)}</div>
          <div className="rounded-2xl border border-white/10 bg-[#0d0f10] p-4">
            <div className="flex items-center justify-between text-sm text-stone/80">
              <span>Vendeur</span>
              <span className="text-white">{data.sellerName}</span>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-stone/80">
              <span>Note</span>
              <span className="inline-flex items-center gap-1 text-white"><Star size={14} className="fill-current text-yellow-400" /> {data.sellerRating}</span>
            </div>
          </div>
          <div className="space-y-3">
            <a href={`tel:${data.sellerPhone}`} className="block w-full rounded-full bg-ember px-4 py-3 text-center text-sm font-medium text-white">Appeler le vendeur</a>
            <p className="text-center text-xs text-stone/70">Contactez le vendeur pour discuter de cette annonce.</p>
          </div>
        </aside>
      </section>
    </div>
  );
}

function SellPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '',
    category: 'Motos',
    brand: '',
    model: '',
    year: '',
    mileage: '',
    city: '',
    price: '',
    imageUrl: '',
    description: ''
  });
  const mutation = useMutation({
    mutationFn: (payload: CreateListingPayload) => createListing(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['home'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      setForm({ title: '', category: 'Motos', brand: '', model: '', year: '', mileage: '', city: '', price: '', imageUrl: '', description: '' });
    }
  });

  const updateField = (field: keyof typeof form, value: string) => setForm((previous) => ({ ...previous, [field]: value }));
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.mutate({
      title: form.title.trim(),
      category: form.category,
      brand: form.brand.trim(),
      model: form.model.trim() || undefined,
      year: form.year ? Number(form.year) : undefined,
      mileage: form.mileage ? Number(form.mileage) : undefined,
      city: form.city.trim(),
      price: Number(form.price),
      imageUrl: form.imageUrl.trim() || undefined,
      description: form.description.trim() || undefined
    });
  };

  return (
    <div className="max-w-4xl rounded-[28px] border border-white/10 bg-[#121416] p-6 md:p-10">
      <div className="mb-8">
        <div className="text-[10px] uppercase tracking-[0.28em] text-ember">Vendre</div>
        <h1 className="mt-2 font-display text-5xl uppercase text-white">Publier une annonce</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-stone">Titre de l’annonce
          <input required maxLength={255} value={form.title} onChange={(event) => updateField('title', event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0d0f10] p-3 text-white" />
        </label>
        <label className="space-y-2 text-sm text-stone">Catégorie
          <select value={form.category} onChange={(event) => updateField('category', event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0d0f10] p-3 text-white">
            {['Motos', 'Voitures', 'Jet Skis', 'Quads', 'Pièces & Accessoires'].map((category) => <option key={category}>{category}</option>)}
          </select>
        </label>
        <label className="space-y-2 text-sm text-stone">Marque
          <input required maxLength={100} value={form.brand} onChange={(event) => updateField('brand', event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0d0f10] p-3 text-white" />
        </label>
        <label className="space-y-2 text-sm text-stone">Modèle
          <input maxLength={100} value={form.model} onChange={(event) => updateField('model', event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0d0f10] p-3 text-white" />
        </label>
        <label className="space-y-2 text-sm text-stone">Année
          <input type="number" min="1900" max="2100" value={form.year} onChange={(event) => updateField('year', event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0d0f10] p-3 text-white" />
        </label>
        <label className="space-y-2 text-sm text-stone">Kilométrage
          <input type="number" min="0" value={form.mileage} onChange={(event) => updateField('mileage', event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0d0f10] p-3 text-white" />
        </label>
        <label className="space-y-2 text-sm text-stone">Prix (€)
          <input required type="number" min="0.01" step="0.01" value={form.price} onChange={(event) => updateField('price', event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0d0f10] p-3 text-white" />
        </label>
        <label className="space-y-2 text-sm text-stone">Ville
          <input required maxLength={120} value={form.city} onChange={(event) => updateField('city', event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0d0f10] p-3 text-white" />
        </label>
        <label className="space-y-2 text-sm text-stone md:col-span-2">URL de la photo
          <input type="url" maxLength={500} value={form.imageUrl} onChange={(event) => updateField('imageUrl', event.target.value)} placeholder="https://…" className="w-full rounded-xl border border-white/10 bg-[#0d0f10] p-3 text-white placeholder:text-stone/60" />
        </label>
        <label className="space-y-2 text-sm text-stone md:col-span-2">Description
          <textarea maxLength={2000} rows={5} value={form.description} onChange={(event) => updateField('description', event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0d0f10] p-3 text-white" />
        </label>
        {mutation.isSuccess && <p role="status" className="text-sm text-emerald-400 md:col-span-2">Annonce envoyée à l’équipe pour validation avant publication.</p>}
        {mutation.isError && <p role="alert" className="text-sm text-red-400 md:col-span-2">L’annonce n’a pas pu être enregistrée. Vérifiez les champs et réessayez.</p>}
        <button type="submit" disabled={mutation.isPending} className="rounded-full bg-ember px-5 py-3 text-sm font-medium text-white disabled:opacity-60 md:col-span-2">
          {mutation.isPending ? 'Envoi en cours…' : 'Envoyer pour validation'}
        </button>
      </form>
    </div>
  );
}

function LoginPage() {
  const { setUser } = useAuthStore();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      const response = mode === 'login'
        ? await loginUser(form.email, form.password)
        : await registerUser({
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            phone: form.phone,
            password: form.password
          });

      setUser({
        email: response.email,
        firstName: response.firstName,
        lastName: response.lastName,
        role: response.role,
        token: response.token,
        refreshToken: response.refreshToken
      });
      navigate(response.role === 'ADMIN' ? '/admin' : '/marketplace');
    } catch (e) {
      setError('Identifiants invalides ou service indisponible.');
    }
  };

  return (
    <div className="mx-auto max-w-lg rounded-[28px] border border-white/10 bg-[#121416] p-8">
      <div className="flex gap-2 rounded-full border border-white/10 bg-[#0d0f10] p-1">
        <button onClick={() => setMode('login')} className={`flex-1 rounded-full px-4 py-2 text-sm ${mode === 'login' ? 'bg-ember text-white' : 'text-stone'}`}>
          Connexion
        </button>
        <button onClick={() => setMode('register')} className={`flex-1 rounded-full px-4 py-2 text-sm ${mode === 'register' ? 'bg-ember text-white' : 'text-stone'}`}>
          Inscription
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {mode === 'register' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#0d0f10] p-3 text-white placeholder:text-stone/60" placeholder="Prénom" />
            <input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#0d0f10] p-3 text-white placeholder:text-stone/60" placeholder="Nom" />
          </div>
        )}

        {mode === 'register' && (
          <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#0d0f10] p-3 text-white placeholder:text-stone/60" placeholder="Téléphone" />
        )}

        <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#0d0f10] p-3 text-white placeholder:text-stone/60" placeholder="Adresse email" />
        <input required type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#0d0f10] p-3 text-white placeholder:text-stone/60" placeholder="Mot de passe" />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button type="submit" className="w-full rounded-full bg-ember px-5 py-3 text-sm font-medium text-white">
          {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
        </button>
      </form>
    </div>
  );
}

function AdminPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ['admin', 'pending'], queryFn: getPendingListings });
  const publishMutation = useMutation({
    mutationFn: publishListing,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'pending'] }),
        queryClient.invalidateQueries({ queryKey: ['home'] }),
        queryClient.invalidateQueries({ queryKey: ['listings'] })
      ]);
    }
  });

  if (isLoading || !data) {
    if (isError) return <ErrorPanel />;
    return <LoadingPanel />;
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="text-[10px] uppercase tracking-[0.28em] text-ember">Back-office</div>
        <h1 className="mt-2 font-display text-5xl uppercase text-white">Modération des annonces</h1>
        <p className="mt-3 text-stone/75">Les nouvelles annonces restent invisibles sur le marché jusqu’à leur validation par un administrateur.</p>
      </div>

      {publishMutation.isError && <p role="alert" className="text-sm text-red-400">Impossible de publier cette annonce. Actualisez la page et réessayez.</p>}
      {data.length === 0 ? (
        <div className="rounded-[24px] border border-white/10 bg-[#121416] p-8 text-center text-stone">Aucune annonce en attente de modération.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((listing: any) => (
            <article key={listing.id} className="overflow-hidden rounded-[24px] border border-white/10 bg-[#121416]">
              {listing.imageUrl && <img src={listing.imageUrl} alt="" className="h-48 w-full object-cover" />}
              <div className="space-y-3 p-5">
                <div className="text-xs uppercase tracking-[0.2em] text-ember">{listing.category}</div>
                <h2 className="font-display text-2xl uppercase text-white">{listing.title}</h2>
                <p className="text-sm text-stone">{listing.brand} {listing.model ?? ''} · {listing.city}</p>
                <p className="text-sm text-stone">{formatPrice(listing.price)} · vendeur : {listing.sellerName}</p>
                <button type="button" disabled={publishMutation.isPending} onClick={() => publishMutation.mutate(listing.id)} className="w-full rounded-full bg-ember px-4 py-3 text-sm font-medium text-white disabled:opacity-60">
                  Publier l’annonce
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function LoadingPanel() {
  return <div className="rounded-[24px] border border-white/10 bg-[#121416] p-10 text-center text-stone">Chargement du marché…</div>;
}

function ErrorPanel() {
  return (
    <div role="alert" className="rounded-[24px] border border-red-500/20 bg-[#121416] p-10 text-center text-red-300">
      Impossible de charger ces données. Vérifiez votre connexion ou <Link to="/login" className="underline">reconnectez-vous</Link>.
    </div>
  );
}

export default App;
