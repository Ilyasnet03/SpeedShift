import logoSpeedshift from './lib/logo-speedshift.png';
import { type ChangeEvent, type FormEvent, type ReactNode, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CarFront,
  Clock,
  Heart,
  SlidersHorizontal,
  ChevronRight,
  Gauge,
  MapPin,
  ArrowLeft,
  Menu,
  Search,
  ShieldCheck,
  Star,
  Sun,
  Moon,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';
import { Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  createListing,
  updateListing,
  updateListingStatus,
  uploadImage,
  assetUrl,
  thumbUrl,
  deleteAdminListing,
  deleteMyListing,
  getAdminListings,
  getAdminListingViews,
  getAdminSiteVisits,
  trackVisit,
  getAdminStats,
  getAdminUsers,
  deleteAdminUser,
  getHome,
  getListing,
  getListings,
  getMyListings,
  loginUser,
  registerUser,
  verifyEmail,
  resendVerificationCode,
  ApiError,
  setAdminListingStatus,
  setAdminUserEnabled,
  setAdminUserRole,
  type AdminListingStatus,
  type AdminListing,
  type AdminUser,
  type AdminDashboardStats,
  type AdminListingView,
  type AdminSiteVisit,
  type CreateListingPayload
} from './services/api';
import { useAuthStore } from './store/authStore';
import { useFavoritesStore } from './store/favoritesStore';

const formatPrice = (value: number | string) =>
  `${new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(Number(value))} DH`;

const getListingImages = (imageValue?: string | null): string[] => {
  if (!imageValue) return [];
  try {
    const parsed: unknown = JSON.parse(imageValue);
    if (Array.isArray(parsed) && parsed.every((image) => typeof image === 'string')) return parsed;
  } catch {
    return [imageValue];
  }
  return [imageValue];
};

const getListingFirstImage = (imageValue?: string | null) => getListingImages(imageValue)[0];

const imageFileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const image = new Image();
  const objectUrl = URL.createObjectURL(file);
  image.onload = () => {
    try {
      const scale = Math.min(1, 1440 / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Impossible de traiter cette image.');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.78));
    } catch {
      reject(new Error('Impossible de traiter cette image. Essayez un autre fichier.'));
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  };
  image.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    reject(new Error('Une des photos ne peut pas être lue.'));
  };
  image.src = objectUrl;
});

const statusLabels: Record<string, string> = {
  published: 'Publiée',
  reserved: 'Réservée',
  sold: 'Vendue',
  pending: 'En attente',
  rejected: 'Refusée',
  archived: 'Archivée'
};

const fuelOptions = ['Essence', 'Diesel', 'Hybride', 'Électrique'];
const transmissionOptions = ['Manuelle', 'Automatique'];

const dataUrlToBlob = async (dataUrl: string) => (await fetch(dataUrl)).blob();

const appNavItems = [
  { label: 'Favoris', to: '/favorites' },
  { label: 'Market', to: '/catalog' },
  { label: 'Mes annonces', to: '/my-listings' },
  { label: 'Poster une annonce', to: '/sell' }
];

function App() {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  useEffect(() => {
    trackVisit(location.pathname);
  }, [location.pathname]);
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    localStorage.getItem('speedshift-theme') === 'dark' ? 'dark' : 'light'
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('speedshift-theme', theme);
  }, [theme]);

  return (
    <div className="min-h-screen bg-carbon text-stone">
      <Header theme={theme} onToggleTheme={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Navigate to="/catalog" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/marketplace" element={<Navigate to="/catalog" replace />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/favorites" element={<RequireAuth><FavoritesPage /></RequireAuth>} />
          <Route path="/my-listings" element={<RequireAuth><MyListingsPage /></RequireAuth>} />
          <Route path="/listing/:id" element={<RequireAuth><ListingDetailPage /></RequireAuth>} />
          <Route path="/sell" element={<RequireAuth><SellPage /></RequireAuth>} />
          <Route path="/listing/:id/edit" element={<RequireAuth><SellPage /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth adminOnly><AdminPage /></RequireAuth>} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/safety" element={<SafetyPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<Navigate to="/catalog" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function RequireAuth({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  if (adminOnly && user.role !== 'ADMIN') {
    return <Navigate to="/catalog" replace />;
  }
  return <>{children}</>;
}

function Header({ theme, onToggleTheme }: { theme: 'dark' | 'light'; onToggleTheme: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navItems = user
    ? [...appNavItems, ...(user.role === 'ADMIN' ? [{ label: 'Administration', to: '/admin' }] : [])]
    : [{ label: 'Market', to: '/catalog' }];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-carbon/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 sm:gap-3">
          <img src={logoSpeedshift} alt="SpeedShift" className="h-9 w-9 rounded-full object-cover sm:h-10 sm:w-10" />
          <div>
            <div className="font-display text-2xl uppercase leading-none text-white sm:text-3xl">SpeedShift</div>
            <div className="text-[10px] uppercase tracking-[0.32em] text-stone">Marketplace</div>
          </div>
        </Link>

        <nav aria-label="Navigation principale" className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 md:flex">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `rounded-full px-4 py-2 text-sm transition ${isActive ? 'bg-ember text-white' : 'text-stone hover:text-white'}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-white">{user.firstName}</span>
              <button onClick={logout} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white">Déconnexion</button>
            </div>
          ) : (
            <Link to="/login" className="rounded-full bg-ember px-4 py-2 text-sm font-medium text-white">Connexion</Link>
          )}
          <button type="button" onClick={onToggleTheme} aria-label={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'} title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'} className="rounded-full border border-white/10 bg-white/5 p-2 text-stone transition hover:text-white">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button type="button" onClick={onToggleTheme} aria-label={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'} className="rounded-full border border-white/10 p-2 text-stone">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'} aria-expanded={menuOpen} className="rounded-full border border-white/10 p-2 text-stone" onClick={() => setMenuOpen(!menuOpen)}>
            <Menu size={18} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="border-t border-white/10 bg-carbon md:hidden">
            <nav aria-label="Navigation mobile" className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} className="rounded-xl px-3 py-2 text-sm text-stone hover:bg-white/5" onClick={() => setMenuOpen(false)}>
                  {item.label}
                </NavLink>
              ))}
              {user ? (
                <button onClick={() => { logout(); setMenuOpen(false); }} className="self-start rounded-xl px-3 py-2 text-sm text-stone hover:bg-white/5">Déconnexion</button>
              ) : (
                <NavLink to="/login" className="rounded-xl px-3 py-2 text-sm text-stone hover:bg-white/5" onClick={() => setMenuOpen(false)}>Connexion</NavLink>
              )}
            </nav>
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
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <Link to="/about" className="hover:text-white">À propos</Link>
          <Link to="/safety" className="hover:text-white">Conseils anti-arnaque</Link>
          <Link to="/contact" className="hover:text-white">Contact</Link>
        </div>
      </div>
    </footer>
  );
}

const CONTACT_PHONE = '0625963977';
const CONTACT_EMAIL = 'productownerchip@gmail.com';

function InfoPage({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl rounded-[28px] border border-white/10 bg-[#121416] p-6 md:p-10">
      <div className="text-[10px] uppercase tracking-[0.28em] text-ember">{eyebrow}</div>
      <h1 className="mt-2 font-display text-4xl uppercase text-white md:text-5xl">{title}</h1>
      <div className="mt-6 space-y-4 leading-relaxed text-stone">{children}</div>
    </div>
  );
}

function AboutPage() {
  return (
    <InfoPage eyebrow="SpeedShift" title="À propos">
      <p>SpeedShift est la marketplace marocaine dédiée aux passionnés de moteur : motos, voitures, jet-skis, quads, pièces et accessoires.</p>
      <p>Notre objectif est simple : mettre en relation acheteurs et vendeurs de façon rapide, claire et directe. Publiez une annonce en quelques minutes, ajoutez vos photos et laissez les acheteurs vous contacter, notamment sur WhatsApp.</p>
      <p>Retrouvez les annonces par catégorie, filtrez par prix, année, kilométrage ou carburant, et enregistrez vos coups de cœur dans vos favoris.</p>
      <Link to="/contact" className="inline-flex rounded-full bg-ember px-5 py-3 text-sm font-medium text-white">Nous contacter</Link>
    </InfoPage>
  );
}

function SafetyPage() {
  const tips = [
    ['Rencontrez le vendeur', 'Voyez toujours le véhicule ou la pièce en personne, dans un lieu public et en journée.'],
    ['Ne payez jamais à l’avance', 'Méfiez-vous des demandes d’acompte, de virement ou de “frais de réservation” avant d’avoir vu le bien.'],
    ['Vérifiez les papiers', 'Contrôlez la carte grise, le numéro de châssis et l’identité du vendeur. Le nom doit correspondre.'],
    ['Méfiez-vous des prix trop bas', 'Une offre bien en dessous du marché est souvent un piège.'],
    ['Faites inspecter le véhicule', 'Essayez-le et, si possible, faites-le vérifier par un mécanicien de confiance.'],
    ['Sécurisez la transaction', 'Privilégiez un paiement le jour de la remise des clés, avec un reçu ou un contrat de vente signé.'],
    ['Gardez vos données privées', 'Ne communiquez jamais vos codes bancaires ni de codes reçus par SMS.']
  ];
  return (
    <InfoPage eyebrow="Sécurité" title="Conseils anti-arnaque">
      <ul className="space-y-4">
        {tips.map(([heading, text]) => (
          <li key={heading} className="rounded-2xl border border-white/10 bg-[#0d0f10] p-4">
            <div className="font-semibold text-white">{heading}</div>
            <p className="mt-1 text-sm">{text}</p>
          </li>
        ))}
      </ul>
      <p>Une annonce vous semble suspecte ? <Link to="/contact" className="text-ember underline">Signalez-la nous</Link>.</p>
    </InfoPage>
  );
}

function ContactPage() {
  return (
    <InfoPage eyebrow="Une question ?" title="Contact">
      <p>Notre équipe vous répond avec plaisir.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <a href={`tel:${CONTACT_PHONE}`} className="rounded-2xl border border-white/10 bg-[#0d0f10] p-4 transition hover:border-ember/40">
          <div className="text-xs uppercase tracking-[0.2em] text-stone/70">Téléphone</div>
          <div className="mt-1 font-semibold text-white">{CONTACT_PHONE}</div>
        </a>
        <a href={`mailto:${CONTACT_EMAIL}`} className="rounded-2xl border border-white/10 bg-[#0d0f10] p-4 transition hover:border-ember/40">
          <div className="text-xs uppercase tracking-[0.2em] text-stone/70">E-mail</div>
          <div className="mt-1 break-all font-semibold text-white">{CONTACT_EMAIL}</div>
        </a>
      </div>
      <a href={`https://wa.me/212${CONTACT_PHONE.slice(1)}`} target="_blank" rel="noreferrer" className="inline-flex rounded-full bg-[#25D366] px-5 py-3 text-sm font-medium text-white">Écrire sur WhatsApp</a>
    </InfoPage>
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
              <h1 className="font-display text-5xl uppercase leading-[0.9] text-white sm:text-6xl md:text-7xl">
                Acheter et vendre les machines <span className="text-ember">qui font battre le cœur.</span>
              </h1>
              <p className="max-w-xl text-base text-stone/80 md:text-lg">
                SpeedShift rassemble motos, voitures, jet-skis, quads et pièces premium dans une expérience claire, rapide et crédible.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to={user ? '/catalog' : '/login'} className="rounded-full bg-ember px-5 py-3 text-sm font-medium text-white transition hover:bg-[#f06d4b]">
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
                {user && <Link to="/catalog" className="block w-full rounded-xl bg-ember px-4 py-3 text-center text-sm font-medium text-white">Voir la marketplace</Link>}
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
          <h2 className="mt-3 max-w-md font-display text-4xl uppercase text-white sm:text-5xl">Une plateforme pensée comme un lieu de rencontre, pas juste un tableau.</h2>
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
            <h2 className="mt-2 text-3xl uppercase text-white sm:text-4xl">La bonne machine dans la bonne catégorie</h2>
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
              <h1 className="font-display text-5xl uppercase leading-[0.9] text-white sm:text-6xl md:text-7xl">
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
        <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-ember">Catégories</div>
            <h2 className="mt-2 text-3xl uppercase text-white sm:text-4xl">Explorer la grille</h2>
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
          {data.latest.map((item: any) => (
            <ListingCard key={item.id} listing={item} compact />
          ))}
        </div>
      </section>
    </div>
  );
}

function timeAgo(value?: string | null) {
  if (!value) return null;
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (Number.isNaN(minutes)) return null;
  if (minutes < 1) return 'à l’instant';
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days} jour${days > 1 ? 's' : ''}`;
  const months = Math.floor(days / 30);
  return months < 12 ? `il y a ${months} mois` : `il y a ${Math.floor(months / 12)} an${months >= 24 ? 's' : ''}`;
}

function ListingCard({ listing }: { listing: any; compact?: boolean }) {
  const userKey = useAuthStore((state) => state.user?.email) ?? 'guest';
  const liked = useFavoritesStore((state) => (state.byUser[userKey] ?? []).includes(listing.id));
  const toggleFavorite = useFavoritesStore((state) => state.toggle);
  const status = String(listing.status ?? '').toLowerCase();
  const isPart = listing.category === 'Pièces & Accessoires';
  const image = getListingFirstImage(listing.imageUrl);
  const heading = listing.title || [listing.brand, listing.model].filter(Boolean).join(' ');
  const ago = timeAgo(listing.createdAt);
  const chips = [
    listing.mileage ? `${listing.mileage.toLocaleString()} km` : null,
    listing.year ? String(listing.year) : null,
    listing.fuel,
    listing.transmission
  ].filter(Boolean) as string[];

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="h-full"
    >
      <Link to={`/listing/${listing.id}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#121416] transition duration-300 hover:-translate-y-1 hover:border-ember/40 hover:shadow-soft">
        <div className="relative overflow-hidden">
          {image ? <img src={thumbUrl(image)} alt={listing.title} loading="lazy" className={`aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105 ${status === 'sold' ? 'opacity-60 grayscale' : ''}`} /> : <div className="aspect-[4/3] bg-black/20" />}
          {(!isPart || status === 'sold' || status === 'reserved') && (
            <span className={`absolute left-3 top-3 rounded-lg px-3 py-1 text-xs font-semibold text-white ${status === 'sold' ? 'bg-neutral-800' : status === 'reserved' ? 'bg-amber-500' : 'bg-emerald-600'}`}>{status === 'sold' ? 'Vendu' : status === 'reserved' ? 'Réservé' : 'Disponible'}</span>
          )}
          <button
            type="button"
            aria-label={liked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            aria-pressed={liked}
            onClick={(event) => { event.preventDefault(); event.stopPropagation(); toggleFavorite(userKey, listing.id); }}
            className="absolute right-3 top-3 rounded-full bg-black/30 p-2 text-white backdrop-blur transition hover:bg-black/50"
          >
            <Heart size={18} className={liked ? 'fill-red-500 text-red-500' : ''} />
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
          <h3 className="line-clamp-1 text-base font-semibold text-white sm:text-lg">{heading}</h3>
          {listing.availability && <AvailabilityBadge value={listing.availability} className="self-start" />}
          <div className="text-xl font-bold text-white sm:text-2xl">{formatPrice(listing.price)}</div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone/80 sm:text-sm">
            {listing.city && <span className="inline-flex items-center gap-1"><MapPin size={14} />{listing.city}</span>}
            {ago && <span className="inline-flex items-center gap-1"><Clock size={14} />{ago}</span>}
          </div>
          {chips.length > 0 && (
            <div className="mt-auto flex flex-wrap gap-2 pt-1">
              {chips.map((chip) => <span key={chip} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-stone">{chip}</span>)}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') ?? undefined;
  const [query, setQuery] = useState(searchParams.get('query') ?? '');
  const [city, setCity] = useState(searchParams.get('city') ?? '');
  const appliedQuery = searchParams.get('query') ?? '';
  const appliedCity = searchParams.get('city') ?? '';
  const [sort, setSort] = useState('featured');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const emptyFilters = { priceMin: '', priceMax: '', yearMin: '', yearMax: '', mileageMax: '', fuel: '', transmission: '', availability: '' };
  const [filters, setFilters] = useState(emptyFilters);
  const setFilter = (field: keyof typeof emptyFilters, value: string) => setFilters((previous) => ({ ...previous, [field]: value }));

  const { data, isLoading } = useQuery({
    queryKey: ['listings', { category, query: appliedQuery, city: appliedCity, sort }],
    queryFn: () => getListings(category, appliedCity, appliedQuery, sort)
  });

  if (isLoading || !data) {
    if (!isLoading) return <ErrorPanel />;
    return <LoadingPanel />;
  }

  const matches = (item: any) => {
    const price = Number(item.price);
    if (filters.priceMin && price < Number(filters.priceMin)) return false;
    if (filters.priceMax && price > Number(filters.priceMax)) return false;
    if (filters.yearMin && !(item.year >= Number(filters.yearMin))) return false;
    if (filters.yearMax && !(item.year <= Number(filters.yearMax))) return false;
    if (filters.mileageMax && !(item.mileage != null && item.mileage <= Number(filters.mileageMax))) return false;
    if (filters.fuel && !String(item.fuel ?? '').toLowerCase().startsWith(filters.fuel.toLowerCase().slice(0, 4))) return false;
    if (filters.transmission && !String(item.transmission ?? '').toLowerCase().startsWith(filters.transmission.toLowerCase().slice(0, 4))) return false;
    if (filters.availability && item.availability !== filters.availability) return false;
    return true;
  };
  const filtered = data.filter(matches);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const filterInput = 'w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white placeholder:text-stone/60';

  return (
    <div className="space-y-8">
      <section className="rounded-[26px] border border-white/10 bg-[#121416] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-ember">Recherche</div>
            <h1 className="mt-2 font-display text-5xl uppercase text-white">Market</h1>
          </div>
          <div className="flex w-full max-w-xl items-center gap-2 rounded-full border border-white/10 bg-black/20 p-2">
            <Search size={16} className="ml-2 text-stone" />
            <input value={query} onFocus={() => setFiltersOpen(true)} onClick={() => setFiltersOpen(true)} onChange={(e) => setQuery(e.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') setSearchParams((previous) => { const next = new URLSearchParams(previous); query.trim() ? next.set('query', query.trim()) : next.delete('query'); return next; }); }} placeholder="Nom, marque ou modèle…" className="w-full bg-transparent text-sm text-white placeholder:text-stone/60 focus:outline-none" />
            <button type="button" onClick={() => setSearchParams((previous) => { const next = new URLSearchParams(previous); query.trim() ? next.set('query', query.trim()) : next.delete('query'); return next; })} className="rounded-full bg-ember px-4 py-2 text-xs uppercase tracking-[0.2em] text-white">GO</button>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        {filtersOpen && <aside className="rounded-[26px] border border-white/10 bg-[#121416] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-[0.3em] text-ember">Critères de recherche</div>
            <button type="button" onClick={() => setFiltersOpen(false)} className="text-xs uppercase tracking-[0.2em] text-stone hover:text-white">Fermer</button>
          </div>
          <div className="grid gap-4 text-sm text-stone sm:grid-cols-2 lg:grid-cols-3">
            <label className="block space-y-2">
              <span>Catégorie</span>
              <select value={category ?? ''} onChange={(event) => setSearchParams((previous) => { const next = new URLSearchParams(previous); event.target.value ? next.set('category', event.target.value) : next.delete('category'); return next; })} className="w-full rounded-xl border border-white/10 bg-[#0b0c0e] p-3 text-white">
                <option value="">Toutes</option>
                {['Motos', 'Voitures', 'Jet Skis', 'Quads', 'Pièces & Accessoires'].map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="block space-y-2">
              <span>Ville</span>
              <input value={city} onChange={(event) => setCity(event.target.value)} onBlur={() => setSearchParams((previous) => { const next = new URLSearchParams(previous); city.trim() ? next.set('city', city.trim()) : next.delete('city'); return next; })} onKeyDown={(event) => { if (event.key === 'Enter') setSearchParams((previous) => { const next = new URLSearchParams(previous); city.trim() ? next.set('city', city.trim()) : next.delete('city'); return next; }); }} placeholder="Ex. Casablanca" className="w-full rounded-xl border border-white/10 bg-black/20 p-3 text-white placeholder:text-stone/60" />
            </label>
            <div className="space-y-2">
              <span>Prix (DH)</span>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" min="0" inputMode="numeric" value={filters.priceMin} onChange={(event) => setFilter('priceMin', event.target.value)} placeholder="Min" aria-label="Prix minimum" className={filterInput} />
                <input type="number" min="0" inputMode="numeric" value={filters.priceMax} onChange={(event) => setFilter('priceMax', event.target.value)} placeholder="Max" aria-label="Prix maximum" className={filterInput} />
              </div>
            </div>
            <div className="space-y-2">
              <span>Année</span>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" min="1900" max="2100" value={filters.yearMin} onChange={(event) => setFilter('yearMin', event.target.value)} placeholder="De" aria-label="Année minimum" className={filterInput} />
                <input type="number" min="1900" max="2100" value={filters.yearMax} onChange={(event) => setFilter('yearMax', event.target.value)} placeholder="À" aria-label="Année maximum" className={filterInput} />
              </div>
            </div>
            <label className="block space-y-2">
              <span>Kilométrage max</span>
              <input type="number" min="0" inputMode="numeric" value={filters.mileageMax} onChange={(event) => setFilter('mileageMax', event.target.value)} placeholder="Ex. 80000" className={filterInput} />
            </label>
            <label className="block space-y-2">
              <span>Carburant</span>
              <select value={filters.fuel} onChange={(event) => setFilter('fuel', event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0b0c0e] p-3 text-white">
                <option value="">Tous</option>
                {fuelOptions.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="block space-y-2">
              <span>Boîte de vitesses</span>
              <select value={filters.transmission} onChange={(event) => setFilter('transmission', event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0b0c0e] p-3 text-white">
                <option value="">Toutes</option>
                {transmissionOptions.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            {(!category || category === 'Pièces & Accessoires') && (
              <label className="block space-y-2">
                <span>Disponibilité (pièces)</span>
                <select value={filters.availability} onChange={(event) => setFilter('availability', event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0b0c0e] p-3 text-white">
                  <option value="">Toutes</option>
                  {availabilityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
            )}
            {activeFilterCount > 0 && (
              <button type="button" onClick={() => setFilters(emptyFilters)} className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white">
                <SlidersHorizontal size={14} /> Réinitialiser ({activeFilterCount})
              </button>
            )}
          </div>
        </aside>}

        <div className="space-y-5">
          <div className="flex items-center justify-between rounded-[24px] border border-white/10 bg-[#121416] px-4 py-3">
            <div className="text-sm text-stone/80">{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</div>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-full border border-white/10 bg-[#0b0c0e] px-3 py-2 text-sm text-white">
              <option value="featured">À la une</option>
              <option value="price_asc">Prix ↑</option>
              <option value="price_desc">Prix ↓</option>
              <option value="newest">Nouveautés</option>
              <option value="popular">Populaires</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {filtered.map((item: any) => (
              <ListingCard key={item.id} listing={item} compact />
            ))}
          </div>
          {filtered.length === 0 && <div className="rounded-[24px] border border-white/10 bg-[#121416] p-8 text-center text-stone">Aucune annonce ne correspond à votre recherche.</div>}
        </div>
      </section>
    </div>
  );
}

function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeImage, setActiveImage] = useState(0);
  const { data, isLoading, isError } = useQuery({ queryKey: ['listing', id], queryFn: () => getListing(Number(id)) });

  if (isLoading || !data) {
    if (isError) return <ErrorPanel />;
    return <LoadingPanel />;
  }

  const images = getListingImages(data.imageUrl);
  const selectedImage = images[Math.min(activeImage, Math.max(images.length - 1, 0))];

  return (
    <div className="space-y-8">
      <button type="button" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/catalog'))} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-stone transition hover:text-white">
        <ArrowLeft size={16} /> Retour
      </button>
      <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[#121416]">
        {selectedImage ? <img src={assetUrl(selectedImage)} alt={data.title} className="mx-auto aspect-square w-full max-w-[560px] object-cover" /> : <div className="flex aspect-square items-center justify-center text-stone">Aucune photo disponible</div>}
      </section>
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto">
          {images.map((image, index) => (
            <button key={image.slice(0, 80) + index} type="button" onClick={() => setActiveImage(index)} aria-label={`Afficher la photo ${index + 1}`} aria-pressed={index === activeImage} className={`shrink-0 overflow-hidden rounded-xl border-2 ${index === activeImage ? 'border-ember' : 'border-white/10'}`}>
              <img src={thumbUrl(image)} alt="" className="h-20 w-20 object-cover" />
            </button>
          ))}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-6 rounded-[28px] border border-white/10 bg-[#121416] p-6">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.26em] text-ember">{data.category}</div>
              <h1 className="mt-2 break-words text-3xl uppercase text-white sm:text-5xl">{data.title}</h1>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-stone">{statusLabels[String(data.status).toLowerCase()] ?? data.status}</div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-stone/80">
            <span className="flex items-center gap-2"><MapPin size={16} /> {data.city}</span>
            {data.year ? <span>{data.year}</span> : null}
            {data.mileage != null ? <span>{`${data.mileage.toLocaleString()} km`}</span> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Object.entries(data.specs).filter(([, value]) => value != null && String(value).trim() !== '' && value !== '-').map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-[#0d0f10] p-3">
                <div className="text-[10px] uppercase tracking-[0.22em] text-stone/70">{label}</div>
                <div className="mt-2 text-lg text-white">{String(value)}</div>
              </div>
            ))}
          </div>

          {data.description?.trim() && (
            <div className="space-y-2">
              <h3 className="font-display text-3xl uppercase text-white">Description</h3>
              <p className="max-w-3xl text-stone/85">{data.description}</p>
            </div>
          )}

          {data.features?.length > 0 && (
            <div>
              <h3 className="font-display text-3xl uppercase text-white">Équipements</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {data.features.map((feature: string) => (
                  <span key={feature} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.2em] text-stone">{feature}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-5 rounded-[28px] border border-white/10 bg-[#121416] p-6">
          <div className="font-display text-5xl uppercase text-ember">{formatPrice(data.price)}</div>
          {data.availability && <AvailabilityBadge value={data.availability} />}
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
            {String(data.status).toLowerCase() === 'sold' ? (
              <p className="rounded-2xl border border-white/10 bg-[#0d0f10] p-4 text-center text-sm text-stone">Cette annonce est vendue.</p>
            ) : (<>
            {buildWhatsAppUrl(data.sellerPhone, data) && (
              <a href={buildWhatsAppUrl(data.sellerPhone, data)!} target="_blank" rel="noopener noreferrer" className="block w-full rounded-full bg-[#25D366] px-4 py-3 text-center text-sm font-medium text-white">Contacter sur WhatsApp</a>
            )}
            <a href={`tel:${data.sellerPhone}`} className="block w-full rounded-full bg-ember px-4 py-3 text-center text-sm font-medium text-white">Appeler le vendeur</a>
            </>)}
            <p className="text-center text-xs text-stone/70">Contactez le vendeur pour discuter de cette annonce.</p>
          </div>
        </aside>
      </section>
    </div>
  );
}

function buildWhatsAppUrl(phone: string | null | undefined, listing: any) {
  let digits = (phone ?? '').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('00')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = `212${digits.slice(1)}`;
  const details = [listing.brand, listing.model, listing.year].filter(Boolean).join(' ');
  const message = `Bonjour, je suis intéressé(e) par votre annonce « ${listing.title} »${details ? ` (${details})` : ''} à ${formatPrice(listing.price)} sur SpeedShift. Est-elle toujours disponible ?`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

const PARTS_CATEGORY = 'Pièces & Accessoires';
const availabilityOptions = [
  { value: 'DISPONIBLE', label: 'Disponible', style: 'bg-emerald-500' },
  { value: 'SUR_COMMANDE', label: 'Sur commande', style: 'bg-amber-500' },
  { value: 'RUPTURE', label: 'Rupture de stock', style: 'bg-red-500' }
];

function AvailabilityBadge({ value, className = '' }: { value?: string | null; className?: string }) {
  const option = availabilityOptions.find((item) => item.value === value);
  if (!option) return null;
  return <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold text-white ${option.style} ${className}`}>{option.label}</span>;
}

function SellPage() {
  const { id } = useParams();
  const editingId = id ? Number(id) : null;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const myListingsQuery = useQuery({ queryKey: ['my-listings'], queryFn: getMyListings, enabled: editingId !== null });
  const editingListing = editingId !== null ? myListingsQuery.data?.find((item) => item.id === editingId) : undefined;
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState('');
  const [form, setForm] = useState({
    title: '',
    category: 'Motos',
    brand: '',
    model: '',
    year: '',
    mileage: '',
    city: '',
    price: '',
    description: '',
    availability: 'DISPONIBLE',
    fuel: '',
    transmission: ''
  });
  const [prefilled, setPrefilled] = useState(false);
  useEffect(() => {
    if (!editingListing || prefilled) return;
    setForm({
      title: editingListing.title ?? '',
      category: editingListing.category ?? 'Motos',
      brand: editingListing.brand ?? '',
      model: editingListing.model ?? '',
      year: editingListing.year ? String(editingListing.year) : '',
      mileage: editingListing.mileage ? String(editingListing.mileage) : '',
      city: editingListing.city ?? '',
      price: String(editingListing.price ?? ''),
      description: editingListing.description ?? '',
      availability: editingListing.availability ?? 'DISPONIBLE',
      fuel: editingListing.fuel ?? '',
      transmission: editingListing.transmission ?? ''
    });
    setPrefilled(true);
  }, [editingListing, prefilled]);
  useEffect(() => () => photoPreviews.forEach((preview) => URL.revokeObjectURL(preview)), [photoPreviews]);

  const mutation = useMutation({
    mutationFn: (payload: CreateListingPayload) => editingId !== null ? updateListing(editingId, payload) : createListing(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listing'] });
      queryClient.invalidateQueries({ queryKey: ['home'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      navigate('/my-listings');
    }
  });

  const updateField = (field: keyof typeof form, value: string) => setForm((previous) => ({ ...previous, [field]: value }));
  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    setPhotoError('');
    if (selected.length > 5) {
      event.target.value = '';
      setPhotoError('Vous pouvez ajouter jusqu’à 5 photos.');
      return;
    }
    const invalidFile = selected.find((file) => !file.type.startsWith('image/') || file.size > 12 * 1024 * 1024);
    if (invalidFile) {
      event.target.value = '';
      setPhotoError('Choisissez des images de 12 Mo maximum chacune.');
      return;
    }
    setPhotos(selected);
    setPhotoPreviews(selected.map((file) => URL.createObjectURL(file)));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPhotoError('');
    if (editingId === null && photos.length === 0) {
      setPhotoError('Ajoutez au moins une photo.');
      return;
    }
    let imageUrl: string | undefined;
    try {
      const uploaded: string[] = [];
      for (const photo of photos) {
        uploaded.push((await uploadImage(await dataUrlToBlob(await imageFileToDataUrl(photo)))).url);
      }
      imageUrl = uploaded.length > 1 ? JSON.stringify(uploaded) : uploaded[0];
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : 'Impossible de traiter les photos sélectionnées.');
      return;
    }
    const isPartsCategory = form.category === PARTS_CATEGORY;
    mutation.mutate({
      title: form.title.trim(),
      category: form.category,
      brand: form.brand.trim() || undefined,
      model: form.model.trim() || undefined,
      year: !isPartsCategory && form.year ? Number(form.year) : undefined,
      mileage: !isPartsCategory && form.mileage ? Number(form.mileage) : undefined,
      city: form.city.trim() || undefined,
      price: Number(form.price),
      imageUrl,
      description: form.description.trim() || undefined,
      fuel: !isPartsCategory ? form.fuel || undefined : undefined,
      transmission: !isPartsCategory ? form.transmission || undefined : undefined,
      availability: form.category === PARTS_CATEGORY ? form.availability : undefined
    });
  };

  return (
    <div className="max-w-4xl rounded-[28px] border border-white/10 bg-[#121416] p-6 md:p-10">
      <div className="mb-8">
        <div className="text-[10px] uppercase tracking-[0.28em] text-ember">Poster une annonce</div>
        <h1 className="mt-2 font-display text-4xl uppercase text-white sm:text-5xl">{editingId !== null ? 'Modifier mon annonce' : 'Publier une annonce'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-stone">Titre de l’annonce *
          <input required maxLength={255} value={form.title} onChange={(event) => updateField('title', event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0d0f10] p-3 text-white" />
        </label>
        <label className="space-y-2 text-sm text-stone">Catégorie *
          <select value={form.category} onChange={(event) => updateField('category', event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0d0f10] p-3 text-white">
            {['Motos', 'Voitures', 'Jet Skis', 'Quads', 'Pièces & Accessoires'].map((category) => <option key={category}>{category}</option>)}
          </select>
        </label>
        {form.category === PARTS_CATEGORY && (
          <label className="space-y-2 text-sm text-stone md:col-span-2">Disponibilité
            <select value={form.availability} onChange={(event) => updateField('availability', event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0d0f10] p-3 text-white">
              {availabilityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        )}
        <label className="space-y-2 text-sm text-stone">Marque
          <input maxLength={100} value={form.brand} onChange={(event) => updateField('brand', event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0d0f10] p-3 text-white" />
        </label>
        <label className="space-y-2 text-sm text-stone">Modèle
          <input maxLength={100} value={form.model} onChange={(event) => updateField('model', event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0d0f10] p-3 text-white" />
        </label>
        {form.category !== PARTS_CATEGORY && (<>
        <label className="space-y-2 text-sm text-stone">Année
          <input type="number" min="1900" max="2100" value={form.year} onChange={(event) => updateField('year', event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0d0f10] p-3 text-white" />
        </label>
        <label className="space-y-2 text-sm text-stone">Carburant
          <select value={form.fuel} onChange={(event) => updateField('fuel', event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0d0f10] p-3 text-white">
            <option value="">Non précisé</option>
            {fuelOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="space-y-2 text-sm text-stone">Boîte de vitesses
          <select value={form.transmission} onChange={(event) => updateField('transmission', event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0d0f10] p-3 text-white">
            <option value="">Non précisée</option>
            {transmissionOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="space-y-2 text-sm text-stone">Kilométrage
          <input type="number" min="0" value={form.mileage} onChange={(event) => updateField('mileage', event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0d0f10] p-3 text-white" />
        </label>
        </>)}
        <label className="space-y-2 text-sm text-stone">Prix (DH) *
          <input required type="number" min="0.01" step="0.01" value={form.price} onChange={(event) => updateField('price', event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0d0f10] p-3 text-white" />
        </label>
        <label className="space-y-2 text-sm text-stone">Ville
          <input maxLength={120} value={form.city} onChange={(event) => updateField('city', event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0d0f10] p-3 text-white" />
        </label>
        <label className="space-y-2 text-sm text-stone md:col-span-2">
          Photos de l’annonce * (1 à 5)
          <input type="file" accept="image/*" multiple required={editingId === null} onChange={handlePhotoChange} className="w-full rounded-xl border border-white/10 bg-[#0d0f10] p-3 text-white file:mr-4 file:rounded-full file:border-0 file:bg-ember file:px-4 file:py-2 file:text-sm file:text-white" />
          <span className="block text-xs text-stone/70">{editingId !== null ? 'Laissez vide pour conserver les photos actuelles. ' : ''}Sélectionnez des photos dans votre téléphone. Elles seront redimensionnées automatiquement avant l’envoi.</span>
        </label>
        {photoPreviews.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:col-span-2">
            {photoPreviews.map((preview, index) => <img key={preview} src={preview} alt={`Aperçu de la photo ${index + 1}`} className="aspect-square w-full rounded-xl object-cover" />)}
          </div>
        )}
        {photoError && <p role="alert" className="text-sm text-red-400 md:col-span-2">{photoError}</p>}
        <label className="space-y-2 text-sm text-stone md:col-span-2">Description
          <textarea maxLength={2000} rows={5} value={form.description} onChange={(event) => updateField('description', event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0d0f10] p-3 text-white" />
        </label>
        
        {mutation.isError && <p role="alert" className="text-sm text-red-400 md:col-span-2">L’annonce n’a pas pu être enregistrée. Vérifiez les champs et réessayez.</p>}
        <button type="submit" disabled={mutation.isPending} className="rounded-full bg-ember px-5 py-3 text-sm font-medium text-white disabled:opacity-60 md:col-span-2">
          {mutation.isPending ? 'Envoi en cours…' : editingId !== null ? 'Enregistrer les modifications' : 'Publier'}
        </button>
      </form>
    </div>
  );
}

function MyListingsPage() {
  const queryClient = useQueryClient();
  const listingsQuery = useQuery({ queryKey: ['my-listings'], queryFn: getMyListings });
  const deleteMutation = useMutation({
    mutationFn: deleteMyListing,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['my-listings'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'listings'] }),
        queryClient.invalidateQueries({ queryKey: ['home'] }),
        queryClient.invalidateQueries({ queryKey: ['listings'] })
      ]);
    }
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'PUBLISHED' | 'RESERVED' | 'SOLD' }) => updateListingStatus(id, status),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['my-listings'] }),
        queryClient.invalidateQueries({ queryKey: ['home'] }),
        queryClient.invalidateQueries({ queryKey: ['listings'] }),
        queryClient.invalidateQueries({ queryKey: ['listing'] })
      ]);
    }
  });

  return (
    <section className="space-y-6">
      <div>
        <div className="text-[10px] uppercase tracking-[0.28em] text-ember">Mon compte</div>
        <h1 className="mt-2 font-display text-4xl uppercase text-white sm:text-5xl">Mes annonces</h1>
        <p className="mt-2 text-stone/75">Consultez le statut de vos annonces ou supprimez celles dont vous n’avez plus besoin.</p>
      </div>
      {deleteMutation.isError && <p role="alert" className="text-sm text-red-400">Suppression impossible : {deleteMutation.error.message}</p>}
      {listingsQuery.isLoading ? <LoadingPanel /> : listingsQuery.isError ? <ErrorPanel error={listingsQuery.error} onRetry={() => listingsQuery.refetch()} /> : !listingsQuery.data ? <ErrorPanel /> : (
        listingsQuery.data.length === 0 ? (
          <div className="rounded-[24px] border border-white/10 bg-[#121416] p-10 text-center text-stone">
            Vous n’avez pas encore publié d’annonce.
            <Link to="/sell" className="mt-4 inline-flex rounded-full bg-ember px-5 py-3 text-sm font-medium text-white">Publier une annonce</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {listingsQuery.data.map((listing) => (
              <article key={listing.id} className="flex flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#121416] sm:flex-row sm:items-center">
                {getListingFirstImage(listing.imageUrl) && <img src={thumbUrl(getListingFirstImage(listing.imageUrl)!)} alt="" className="h-48 w-full object-cover sm:h-40 sm:w-48 sm:shrink-0" />}
                <div className="flex-1 space-y-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-display text-xl uppercase text-white">{listing.title}</h2>
                    <span className="shrink-0 rounded-full border border-white/10 px-3 py-1 text-xs text-stone">{statusLabels[String(listing.status).toLowerCase()] ?? listing.status}</span>
                  </div>
                  <p className="text-sm text-stone">{[listing.brand, listing.model, listing.city].filter(Boolean).join(' · ')}</p>
                  <p className="font-display text-2xl text-ember">{formatPrice(listing.price)}</p>
                  <AvailabilityBadge value={listing.availability} />
                </div>
                <div className="space-y-2 p-4 sm:w-60 sm:shrink-0">
                  {['published', 'reserved', 'sold'].includes(String(listing.status).toLowerCase()) && (
                    <div className="grid grid-cols-1 gap-2">
                      {String(listing.status).toLowerCase() !== 'published' && <button type="button" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ id: listing.id, status: 'PUBLISHED' })} className="rounded-full border border-emerald-500/40 px-3 py-2 text-xs text-emerald-500 disabled:opacity-50">Remettre en vente</button>}
                      {String(listing.status).toLowerCase() === 'published' && <button type="button" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ id: listing.id, status: 'RESERVED' })} className="rounded-full border border-amber-500/40 px-3 py-2 text-xs text-amber-500 disabled:opacity-50">Marquer réservé</button>}
                      {String(listing.status).toLowerCase() !== 'sold' && <button type="button" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ id: listing.id, status: 'SOLD' })} className="rounded-full border border-white/20 px-3 py-2 text-xs text-white disabled:opacity-50">Marquer vendu</button>}
                    </div>
                  )}
                  <Link to={`/listing/${listing.id}/edit`} className="block w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 text-center text-sm text-white">Modifier mon annonce</Link>
                  <button type="button" disabled={deleteMutation.isPending} onClick={() => {
                    if (window.confirm(`Supprimer définitivement votre annonce « ${listing.title} » ?`)) {
                      deleteMutation.mutate(listing.id);
                    }
                  }} className="w-full rounded-full border border-red-500/40 px-4 py-2 text-sm text-red-400 disabled:opacity-50">
                    Supprimer mon annonce
                  </button>
                </div>
              </article>
            ))}
          </div>
        )
      )}
    </section>
  );
}

function FavoritesPage() {
  const userKey = useAuthStore((state) => state.user?.email) ?? 'guest';
  const favoriteIds = useFavoritesStore((state) => state.byUser[userKey]);
  const { data, isLoading, isError } = useQuery({ queryKey: ['listings', 'favorites'], queryFn: () => getListings() });

  if (isLoading) return <LoadingPanel />;
  if (isError || !data) return <ErrorPanel />;
  const favorites = data.filter((item: any) => (favoriteIds ?? []).includes(item.id));

  return (
    <section className="space-y-6">
      <div>
        <div className="text-[10px] uppercase tracking-[0.28em] text-ember">Mon compte</div>
        <h1 className="mt-2 font-display text-4xl uppercase text-white sm:text-5xl">Mes favoris</h1>
      </div>
      {favorites.length === 0 ? (
        <div className="rounded-[24px] border border-white/10 bg-[#121416] p-10 text-center text-stone">
          Vous n’avez pas encore de favoris. Touchez le cœur d’une annonce pour la retrouver ici.
          <Link to="/catalog" className="mt-4 inline-flex rounded-full bg-ember px-5 py-3 text-sm font-medium text-white">Parcourir le Market</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
          {favorites.map((item: any) => <ListingCard key={item.id} listing={item} />)}
        </div>
      )}
    </section>
  );
}

function LoginPage() {
  const { setUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [info, setInfo] = useState<string | null>(null);

  const finishLogin = (response: any) => {
    setUser({
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      role: response.role,
      token: response.token,
      refreshToken: response.refreshToken
    });
    const from = (location.state as { from?: string } | null)?.from;
    navigate(response.role === 'ADMIN' ? '/admin' : from && from.startsWith('/') ? from : '/catalog');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setInfo(null);

    try {
      if (mode === 'login') {
        finishLogin(await loginUser(form.email, form.password));
        return;
      }
      await registerUser({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: `+212${form.phone.replace(/\D/g, '')}`,
        password: form.password
      });
      setCode('');
      setPendingEmail(form.email);
      setInfo(`Un code à 6 chiffres a été envoyé à ${form.email}.`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 403 && mode === 'login') {
        setCode('');
        setPendingEmail(form.email);
        setInfo('Votre e-mail n’est pas encore vérifié. Saisissez le code reçu ou demandez-en un nouveau.');
        return;
      }
      if (e instanceof ApiError && e.status === 409) {
        setError('Un compte existe déjà avec cet e-mail. Connectez-vous.');
        return;
      }
      setError(mode === 'login' ? 'Identifiants invalides ou service indisponible.' : 'Inscription impossible. Vérifiez vos informations et réessayez.');
    }
  };

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pendingEmail) return;
    setError(null);
    try {
      finishLogin(await verifyEmail(pendingEmail, code.trim()));
    } catch (e) {
      const status = e instanceof ApiError ? e.status : 0;
      setError(
        status === 410 ? 'Ce code a expiré. Demandez-en un nouveau.'
        : status === 429 ? 'Trop de tentatives. Demandez un nouveau code.'
        : status === 400 ? 'Code incorrect.'
        : 'Vérification impossible. Réessayez.'
      );
    }
  };

  const handleResend = async () => {
    if (!pendingEmail) return;
    setError(null);
    setInfo(null);
    try {
      await resendVerificationCode(pendingEmail);
      setInfo(`Un nouveau code a été envoyé à ${pendingEmail}.`);
    } catch (e) {
      setError(e instanceof ApiError && e.status === 429 ? 'Patientez une minute avant de redemander un code.' : 'Envoi impossible. Réessayez.');
    }
  };

  if (pendingEmail) {
    return (
      <div className="mx-auto max-w-lg rounded-[28px] border border-white/10 bg-[#121416] p-6 sm:p-8">
        <h1 className="font-display text-3xl uppercase text-white">Vérifiez votre e-mail</h1>
        <p className="mt-3 text-sm text-stone">Saisissez le code à 6 chiffres envoyé à <strong className="text-white">{pendingEmail}</strong>. Il est valable 15 minutes.</p>
        <form onSubmit={handleVerify} className="mt-6 space-y-4">
          <input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="w-full rounded-xl border border-white/10 bg-[#0d0f10] p-3 text-center text-2xl tracking-[0.5em] text-white placeholder:text-stone/60" placeholder="000000" />
          {info && <p className="text-sm text-emerald-400">{info}</p>}
          {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={code.length !== 6} className="w-full rounded-full bg-ember px-5 py-3 text-sm font-medium text-white disabled:opacity-60">Valider</button>
        </form>
        <div className="mt-4 flex justify-between text-sm">
          <button type="button" onClick={handleResend} className="text-ember hover:underline">Renvoyer le code</button>
          <button type="button" onClick={() => { setPendingEmail(null); setError(null); setInfo(null); }} className="text-stone hover:text-white">Retour</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg rounded-[28px] border border-white/10 bg-[#121416] p-6 sm:p-8">
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
          <label className="block space-y-2 text-sm text-stone">
            Téléphone marocain
            <span className="flex overflow-hidden rounded-xl border border-white/10 bg-[#0d0f10]">
              <span className="flex items-center border-r border-white/10 px-4 text-stone">+212</span>
              <input
                required
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                pattern="[67][0-9]{8}"
                maxLength={9}
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value.replace(/\D/g, '').slice(0, 9) })}
                className="w-full bg-transparent p-3 text-white placeholder:text-stone/60"
                placeholder="6 12 34 56 78"
                title="Saisissez les 9 chiffres après +212 (commence par 6 ou 7)."
              />
            </span>
            <span className="block text-xs text-stone/60">Saisissez les 9 chiffres après +212.</span>
          </label>
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

function DashboardOverview({ stats, users, listings, views, visits, onModerate, onOpen }: {
  stats: AdminDashboardStats;
  users: AdminUser[];
  listings: AdminListing[];
  views: AdminListingView[];
  visits: AdminSiteVisit[];
  onModerate: (id: number, status: AdminListingStatus) => void;
  onOpen: (section: 'users' | 'listings' | 'views' | 'visits') => void;
}) {
  const dayKey = (value: string | null) => (value ? new Date(value).toISOString().slice(0, 10) : '');
  const today = new Date().toISOString().slice(0, 10);
  const days = Array.from({ length: 14 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - index));
    return date.toISOString().slice(0, 10);
  });
  const visitsByDay = days.map((day) => visits.filter((visit) => dayKey(visit.visitedAt) === day));
  const maxDay = Math.max(1, ...visitsByDay.map((items) => items.length));
  const uniqueVisitors = new Set(visits.map((visit) => visit.visitorId)).size;
  const anonymousVisitors = new Set(visits.filter((visit) => visit.userId == null).map((visit) => visit.visitorId)).size;
  const visitsToday = visits.filter((visit) => dayKey(visit.visitedAt) === today);
  const pending = listings.filter((listing) => listing.status === 'PENDING');
  const admins = users.filter((user) => user.role === 'ADMIN').length;

  const countBy = <T,>(items: T[], key: (item: T) => string) => {
    const map = new Map<string, number>();
    items.forEach((item) => map.set(key(item), (map.get(key(item)) ?? 0) + 1));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  };
  const byCategory = countBy(listings, (listing) => listing.category || 'Autre').slice(0, 6);
  const byCity = countBy(listings.filter((listing) => listing.city), (listing) => listing.city as string).slice(0, 5);
  const topViewed = countBy(views, (view) => `${view.listingId}|${view.listingTitle}`).slice(0, 5);
  const topPages = countBy(visits, (visit) => visit.path).slice(0, 5);
  const visitorName = (visit: AdminSiteVisit) => (visit.email ? `${visit.firstName ?? ''} ${visit.lastName ?? ''}`.trim() || visit.email : `Anonyme #${visit.visitorId.slice(0, 8)}`);
  const fmt = (value: string | null) => (value ? new Date(value).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—');

  const kpis: [string, string | number, string][] = [
    ['Utilisateurs', stats.totalUsers, `${stats.activeUsers} actifs · ${stats.disabledUsers} suspendus · ${admins} admin`],
    ['Nouveaux (30 j)', stats.newUsersLast30Days, 'Inscriptions récentes'],
    ['Annonces', stats.totalListings, `${stats.publishedListings} publiées · ${stats.rejectedListings} refusées`],
    ['À valider', stats.pendingListings, 'Annonces en attente'],
    ['Prix moyen', formatPrice(stats.averagePublishedPrice), 'Annonces publiées'],
    ['Visiteurs uniques', uniqueVisitors, `${anonymousVisitors} anonymes · ${visitsToday.length} visites aujourd'hui`],
    ['Visites enregistrées', visits.length, 'Dernières 500 pages vues'],
    ['Consultations d\'annonces', views.length, 'Par utilisateurs connectés']
  ];
  const card = 'rounded-[24px] border border-white/10 bg-[#121416] p-5';
  const bar = (label: string, value: number, max: number) => (
    <li key={label} className="space-y-1">
      <div className="flex justify-between gap-3 text-sm text-white"><span className="truncate">{label}</span><span className="text-stone">{value}</span></div>
      <div className="h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-ember" style={{ width: `${(value / max) * 100}%` }} /></div>
    </li>
  );

  return (
    <section aria-label="Dashboard" className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(([label, value, hint]) => (
          <article key={label} className={card}>
            <h2 className="text-xs uppercase tracking-[0.2em] text-stone/70">{label}</h2>
            <p className="mt-2 font-display text-4xl uppercase text-white">{value}</p>
            <p className="mt-1 text-xs text-stone/70">{hint}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <article className={`${card} lg:col-span-2`}>
          <h2 className="font-display text-2xl uppercase text-white">Visites — 14 derniers jours</h2>
          <div className="mt-5 flex h-40 items-end gap-2">
            {visitsByDay.map((items, index) => (
              <div key={days[index]} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${days[index]} : ${items.length}`}>
                <span className="text-[10px] text-stone">{items.length}</span>
                <div className="w-full rounded-t bg-ember" style={{ height: `${Math.max(4, (items.length / maxDay) * 100)}%` }} />
                <span className="text-[9px] text-stone/60">{days[index].slice(8)}</span>
              </div>
            ))}
          </div>
        </article>
        <article className={card}>
          <h2 className="font-display text-2xl uppercase text-white">Pages les plus vues</h2>
          <ul className="mt-4 space-y-3">{topPages.length ? topPages.map(([path, n]) => bar(path, n, topPages[0][1])) : <li className="text-sm text-stone">Aucune donnée.</li>}</ul>
        </article>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <article className={card}>
          <h2 className="font-display text-2xl uppercase text-white">Annonces par catégorie</h2>
          <ul className="mt-4 space-y-3">{byCategory.length ? byCategory.map(([k, n]) => bar(k, n, byCategory[0][1])) : <li className="text-sm text-stone">Aucune donnée.</li>}</ul>
        </article>
        <article className={card}>
          <h2 className="font-display text-2xl uppercase text-white">Annonces par ville</h2>
          <ul className="mt-4 space-y-3">{byCity.length ? byCity.map(([k, n]) => bar(k, n, byCity[0][1])) : <li className="text-sm text-stone">Aucune donnée.</li>}</ul>
        </article>
        <article className={card}>
          <h2 className="font-display text-2xl uppercase text-white">Annonces les plus consultées</h2>
          <ul className="mt-4 space-y-3">{topViewed.length ? topViewed.map(([k, n]) => bar(k.split('|')[1], n, topViewed[0][1])) : <li className="text-sm text-stone">Aucune donnée.</li>}</ul>
        </article>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <article className={card}>
          <div className="flex items-center justify-between"><h2 className="font-display text-2xl uppercase text-white">À modérer ({pending.length})</h2><button type="button" onClick={() => onOpen('listings')} className="text-xs uppercase tracking-[0.2em] text-ember">Tout voir</button></div>
          <ul className="mt-4 space-y-3">
            {pending.slice(0, 5).map((listing) => (
              <li key={listing.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 p-3">
                <div className="min-w-0"><Link to={`/listing/${listing.id}`} className="block truncate text-sm text-white hover:text-ember">{listing.title}</Link><span className="text-xs text-stone">{listing.sellerName ?? '—'} · {formatPrice(listing.price)}</span></div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => onModerate(listing.id, 'PUBLISHED')} className="rounded-full bg-ember px-3 py-1 text-xs text-white">Publier</button>
                  <button type="button" onClick={() => onModerate(listing.id, 'REJECTED')} className="rounded-full border border-white/10 px-3 py-1 text-xs text-stone hover:text-white">Refuser</button>
                </div>
              </li>
            ))}
            {pending.length === 0 && <li className="text-sm text-stone">Aucune annonce en attente.</li>}
          </ul>
        </article>
        <article className={card}>
          <div className="flex items-center justify-between"><h2 className="font-display text-2xl uppercase text-white">Derniers inscrits</h2><button type="button" onClick={() => onOpen('users')} className="text-xs uppercase tracking-[0.2em] text-ember">Tout voir</button></div>
          <ul className="mt-4 space-y-3">
            {[...users].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')).slice(0, 5).map((user) => (
              <li key={user.id} className="flex justify-between gap-3 text-sm"><span className="truncate text-white">{user.firstName} {user.lastName} <span className="text-stone">· {user.email}</span></span><span className="shrink-0 text-xs text-stone">{fmt(user.createdAt)}</span></li>
            ))}
            {users.length === 0 && <li className="text-sm text-stone">Aucun utilisateur.</li>}
          </ul>
        </article>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <article className={card}>
          <div className="flex items-center justify-between"><h2 className="font-display text-2xl uppercase text-white">Activité des visiteurs</h2><button type="button" onClick={() => onOpen('visits')} className="text-xs uppercase tracking-[0.2em] text-ember">Tout voir</button></div>
          <ul className="mt-4 space-y-3">
            {visits.slice(0, 6).map((visit) => (
              <li key={visit.id} className="flex justify-between gap-3 text-sm"><span className="truncate text-white">{visitorName(visit)} <span className="text-stone">· {visit.path}</span></span><span className="shrink-0 text-xs text-stone">{fmt(visit.visitedAt)}</span></li>
            ))}
            {visits.length === 0 && <li className="text-sm text-stone">Aucune visite.</li>}
          </ul>
        </article>
        <article className={card}>
          <div className="flex items-center justify-between"><h2 className="font-display text-2xl uppercase text-white">Dernières consultations</h2><button type="button" onClick={() => onOpen('views')} className="text-xs uppercase tracking-[0.2em] text-ember">Tout voir</button></div>
          <ul className="mt-4 space-y-3">
            {views.slice(0, 6).map((view) => (
              <li key={view.id} className="flex justify-between gap-3 text-sm"><span className="truncate text-white">{view.firstName} {view.lastName} <span className="text-stone">→ {view.listingTitle}</span></span><span className="shrink-0 text-xs text-stone">{fmt(view.viewedAt)}</span></li>
            ))}
            {views.length === 0 && <li className="text-sm text-stone">Aucune consultation.</li>}
          </ul>
        </article>
      </div>
    </section>
  );
}

function AdminPage() {
  const currentUserEmail = useAuthStore((state) => state.user?.email);
  const queryClient = useQueryClient();
  const [section, setSection] = useState<'stats' | 'users' | 'listings' | 'views' | 'visits'>('stats');
  const visitsQuery = useQuery({ queryKey: ['admin', 'visits'], queryFn: getAdminSiteVisits, enabled: section === 'visits' || section === 'stats' });
  const [search, setSearch] = useState('');
  const viewsQuery = useQuery({ queryKey: ['admin', 'views'], queryFn: getAdminListingViews, enabled: section === 'views' || section === 'stats' });
  const statsQuery = useQuery({ queryKey: ['admin', 'stats'], queryFn: getAdminStats, enabled: section === 'stats' });
  const usersQuery = useQuery({ queryKey: ['admin', 'users'], queryFn: getAdminUsers, enabled: section === 'users' || section === 'stats' });
  const listingsQuery = useQuery({ queryKey: ['admin', 'listings'], queryFn: getAdminListings, enabled: section === 'listings' || section === 'stats' });

  const refreshAdminData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin'] }),
      queryClient.invalidateQueries({ queryKey: ['home'] }),
      queryClient.invalidateQueries({ queryKey: ['listings'] })
    ]);
  };

  const deleteListingMutation = useMutation({
    mutationFn: deleteAdminListing,
    onSuccess: refreshAdminData
  });
  const enabledMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) => setAdminUserEnabled(id, enabled),
    onSuccess: refreshAdminData
  });
  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: 'CLIENT' | 'ADMIN' }) => setAdminUserRole(id, role),
    onSuccess: refreshAdminData
  });
  const deleteUserMutation = useMutation({
    mutationFn: deleteAdminUser,
    onSuccess: refreshAdminData
  });
  const listingMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: AdminListingStatus }) => setAdminListingStatus(id, status),
    onSuccess: refreshAdminData
  });

  const mutationError = enabledMutation.isError || roleMutation.isError || deleteUserMutation.isError || listingMutation.isError;
  const tabClass = (tab: typeof section) =>
    `rounded-full px-5 py-3 text-sm font-medium transition ${section === tab ? 'bg-ember text-white' : 'border border-white/10 bg-white/5 text-stone hover:text-white'}`;

  return (
    <div className="space-y-8">
      <div>
        <div className="text-[10px] uppercase tracking-[0.28em] text-ember">Espace sécurisé</div>
        <h1 className="mt-2 font-display text-4xl uppercase text-white sm:text-5xl">Dashboard admin</h1>
        <p className="mt-3 text-stone/75">Statistiques, comptes et annonces de la marketplace.</p>
      </div>

      <nav aria-label="Sections du dashboard" className="flex flex-wrap gap-3">
        <button type="button" className={tabClass('stats')} onClick={() => { setSection('stats'); setSearch(''); }}>Dashboard</button>
        <button type="button" className={tabClass('users')} onClick={() => { setSection('users'); setSearch(''); }}>Utilisateurs</button>
        <button type="button" className={tabClass('listings')} onClick={() => { setSection('listings'); setSearch(''); }}>Annonces</button>
        <button type="button" className={tabClass('views')} onClick={() => { setSection('views'); setSearch(''); }}>Consultations</button>
        <button type="button" className={tabClass('visits')} onClick={() => { setSection('visits'); setSearch(''); }}>Visiteurs</button>
      </nav>

      {(mutationError || deleteListingMutation.isError) && <p role="alert" className="text-sm text-red-400">Action impossible. {deleteListingMutation.error instanceof Error ? deleteListingMutation.error.message : 'Vérifiez les droits et réessayez.'}</p>}

      {section === 'stats' && (
        statsQuery.isLoading ? <LoadingPanel /> : statsQuery.isError || !statsQuery.data ? <ErrorPanel error={statsQuery.error} onRetry={() => statsQuery.refetch()} /> : (
          <DashboardOverview
            stats={statsQuery.data}
            users={usersQuery.data ?? []}
            listings={listingsQuery.data ?? []}
            views={viewsQuery.data ?? []}
            visits={visitsQuery.data ?? []}
            onModerate={(id, status) => listingMutation.mutate({ id, status })}
            onOpen={setSection}
          />
        )
      )}

      {section === 'visits' && (
        <section className="space-y-5">
          <div className="rounded-[24px] border border-white/10 bg-[#121416] p-5">
            <h2 className="font-display text-3xl uppercase text-white">Visiteurs du site</h2>
            <p className="text-sm text-stone/70">Toutes les visites, connectées ou anonymes (500 dernières).</p>
          </div>
          {visitsQuery.isLoading ? <LoadingPanel /> : visitsQuery.isError || !visitsQuery.data ? <ErrorPanel error={visitsQuery.error} onRetry={() => visitsQuery.refetch()} /> : (
            <div className="overflow-x-auto rounded-[24px] border border-white/10 bg-[#121416]">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-stone/60">
                  <tr><th className="p-4">Date</th><th className="p-4">Visiteur</th><th className="p-4">Page</th></tr>
                </thead>
                <tbody>
                  {visitsQuery.data.map((visit) => (
                    <tr key={visit.id} className="border-b border-white/5 text-stone last:border-0">
                      <td className="p-4">{new Date(visit.visitedAt).toLocaleString('fr-MA')}</td>
                      <td className="p-4">
                        {visit.userId ? <><div className="font-medium text-white">{visit.firstName} {visit.lastName}</div><div className="text-xs text-stone/60">{visit.email}</div></> : <><div className="font-medium text-white">Anonyme</div><div className="text-xs text-stone/60">#{visit.visitorId.slice(0, 8)}</div></>}
                      </td>
                      <td className="p-4">{visit.path}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {visitsQuery.data.length === 0 && <p className="p-6 text-center text-stone">Aucune visite pour le moment.</p>}
            </div>
          )}
        </section>
      )}

      {section === 'views' && (
        <section className="space-y-5">
          <div className="rounded-[24px] border border-white/10 bg-[#121416] p-5">
            <h2 className="font-display text-3xl uppercase text-white">Consultations d'annonces</h2>
            <p className="text-sm text-stone/70">Qui a consulté quelle annonce (500 dernières).</p>
          </div>
          {viewsQuery.isLoading ? <LoadingPanel /> : viewsQuery.isError || !viewsQuery.data ? <ErrorPanel error={viewsQuery.error} onRetry={() => viewsQuery.refetch()} /> : (
            <div className="overflow-x-auto rounded-[24px] border border-white/10 bg-[#121416]">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-stone/60">
                  <tr><th className="p-4">Date</th><th className="p-4">Utilisateur</th><th className="p-4">Annonce</th></tr>
                </thead>
                <tbody>
                  {viewsQuery.data.map((view) => (
                    <tr key={view.id} className="border-b border-white/5 text-stone last:border-0">
                      <td className="p-4">{new Date(view.viewedAt).toLocaleString('fr-MA')}</td>
                      <td className="p-4"><div className="font-medium text-white">{view.firstName} {view.lastName}</div><div className="text-xs text-stone/60">{view.email}</div></td>
                      <td className="p-4"><Link to={`/listing/${view.listingId}`} className="text-white hover:text-ember">{view.listingTitle}</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {viewsQuery.data.length === 0 && <p className="p-6 text-center text-stone">Aucune consultation pour le moment.</p>}
            </div>
          )}
        </section>
      )}

      {section === 'users' && (
        <section className="space-y-5">
          <div className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-[#121416] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-3xl uppercase text-white">Gestion des utilisateurs</h2>
              <p className="text-sm text-stone/70">Suspendre ou réactiver un compte, et gérer les rôles.</p>
            </div>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher nom, e-mail ou téléphone" className="w-full rounded-xl border border-white/10 bg-[#0d0f10] p-3 text-sm text-white placeholder:text-stone/50 sm:max-w-sm" />
          </div>
          {usersQuery.isLoading ? <LoadingPanel /> : usersQuery.isError || !usersQuery.data ? <ErrorPanel error={usersQuery.error} onRetry={() => usersQuery.refetch()} /> : (
            <div className="overflow-x-auto rounded-[24px] border border-white/10 bg-[#121416]">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-stone/60">
                  <tr><th className="p-4">Utilisateur</th><th className="p-4">Téléphone</th><th className="p-4">Inscription</th><th className="p-4">Rôle</th><th className="p-4">État</th><th className="p-4">Actions</th></tr>
                </thead>
                <tbody>
                  {usersQuery.data.filter((user) => `${user.firstName} ${user.lastName} ${user.email} ${user.phone ?? ''}`.toLowerCase().includes(search.toLowerCase())).map((user) => (
                    <tr key={user.id} className="border-b border-white/5 text-stone last:border-0">
                      <td className="p-4"><div className="font-medium text-white">{user.firstName} {user.lastName}</div><div className="text-xs text-stone/60">{user.email}</div></td>
                      <td className="p-4">{user.phone ?? '—'}</td>
                      <td className="p-4">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-MA') : '—'}</td>
                      <td className="p-4">{user.role === 'ADMIN' ? 'Administrateur' : 'Client'}</td>
                      <td className="p-4"><span className={user.enabled ? 'text-emerald-400' : 'text-red-400'}>{user.enabled ? 'Actif' : 'Suspendu'}</span></td>
                      <td className="space-x-2 p-4">
                        <button type="button" disabled={enabledMutation.isPending} onClick={() => enabledMutation.mutate({ id: user.id, enabled: !user.enabled })} className="rounded-full border border-white/10 px-3 py-2 text-xs text-white disabled:opacity-50">
                          {user.enabled ? 'Suspendre' : 'Réactiver'}
                        </button>
                        <button type="button" disabled={roleMutation.isPending} onClick={() => roleMutation.mutate({ id: user.id, role: user.role === 'ADMIN' ? 'CLIENT' : 'ADMIN' })} className="rounded-full border border-ember/40 px-3 py-2 text-xs text-white disabled:opacity-50">
                          {user.role === 'ADMIN' ? 'Retirer admin' : 'Rendre admin'}
                        </button>
                        {user.email !== currentUserEmail && (
                          <button type="button" disabled={deleteUserMutation.isPending} onClick={() => {
                            if (window.confirm(`Supprimer définitivement le compte de ${user.firstName} ${user.lastName} ? Ses annonces resteront publiées sans propriétaire associé.`)) {
                              deleteUserMutation.mutate(user.id);
                            }
                          }} className="rounded-full border border-red-500/40 px-3 py-2 text-xs text-red-400 disabled:opacity-50">
                            Supprimer
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {usersQuery.data.filter((user) => `${user.firstName} ${user.lastName} ${user.email} ${user.phone ?? ''}`.toLowerCase().includes(search.toLowerCase())).length === 0 && <p className="p-8 text-center text-stone">Aucun utilisateur trouvé.</p>}
            </div>
          )}
        </section>
      )}

      {section === 'listings' && (
        <section className="space-y-5">
          <div className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-[#121416] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-3xl uppercase text-white">Gestion des annonces</h2>
              <p className="text-sm text-stone/70">Publier, refuser ou archiver les annonces. Les changements sont réversibles.</p>
            </div>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher une annonce, un vendeur…" className="w-full rounded-xl border border-white/10 bg-[#0d0f10] p-3 text-sm text-white placeholder:text-stone/50 sm:max-w-sm" />
          </div>
          {listingsQuery.isLoading ? <LoadingPanel /> : listingsQuery.isError || !listingsQuery.data ? <ErrorPanel error={listingsQuery.error} onRetry={() => listingsQuery.refetch()} /> : (
            <div className="flex flex-col gap-3">
              {listingsQuery.data.filter((listing) => `${listing.title} ${listing.category} ${listing.brand ?? ''} ${listing.model ?? ''} ${listing.sellerName ?? ''} ${listing.city ?? ''}`.toLowerCase().includes(search.toLowerCase())).map((listing) => {
                const image = getListingFirstImage(listing.imageUrl);
                return (
                  <article key={listing.id} className="flex flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#121416] sm:flex-row sm:items-center">
                    {image && <img src={image} alt="" className="h-48 w-full object-cover sm:h-44 sm:w-52 sm:shrink-0" />}
                    <div className="flex-1 space-y-2 p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xs uppercase tracking-[0.2em] text-ember">{listing.category}</span>
                        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-stone">{listing.status}</span>
                      </div>
                      <h3 className="font-display text-xl uppercase text-white">{listing.title}</h3>
                      <p className="text-sm text-stone">{[listing.brand, listing.model, listing.city].filter(Boolean).join(' · ')}</p>
                      <p className="text-sm text-stone">{formatPrice(listing.price)} · {listing.sellerName ?? 'Vendeur inconnu'}</p>
                      <p className="line-clamp-2 text-sm text-stone/70">{listing.description ?? 'Aucune description.'}</p>
                    </div>
                    <div className="space-y-2 p-4 sm:w-60 sm:shrink-0">
                      <label className="block space-y-1 text-xs text-stone/70">Statut de l’annonce
                        <select value={(listing.status ?? 'pending').toUpperCase()} disabled={listingMutation.isPending} onChange={(event) => listingMutation.mutate({ id: listing.id, status: event.target.value as AdminListingStatus })} className="w-full rounded-xl border border-white/10 bg-[#0d0f10] p-3 text-sm text-white disabled:opacity-50">
                          <option value="PENDING">En attente</option>
                          <option value="PUBLISHED">Publiée</option>
                          <option value="REJECTED">Refusée</option>
                          <option value="ARCHIVED">Archivée</option>
                        </select>
                      </label>
                      <button type="button" disabled={deleteListingMutation.isPending} onClick={() => {
                        if (window.confirm(`Supprimer définitivement l’annonce « ${listing.title} » ?`)) {
                          deleteListingMutation.mutate(listing.id);
                        }
                      }} className="w-full rounded-full border border-red-500/40 px-4 py-2 text-sm text-red-400 disabled:opacity-50">
                        Supprimer l’annonce
                      </button>
                    </div>
                  </article>
                );
              })}
              {listingsQuery.data.filter((listing) => `${listing.title} ${listing.category} ${listing.brand ?? ''} ${listing.model ?? ''} ${listing.sellerName ?? ''} ${listing.city ?? ''}`.toLowerCase().includes(search.toLowerCase())).length === 0 && <p className="rounded-[24px] border border-white/10 bg-[#121416] p-8 text-center text-stone md:col-span-2 xl:col-span-3">Aucune annonce trouvée.</p>}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function LoadingPanel() {
  return <div className="rounded-[24px] border border-white/10 bg-[#121416] p-10 text-center text-stone">Chargement du marché…</div>;
}

function ErrorPanel({ error, onRetry }: { error?: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : '';
  const status = Number(message.match(/HTTP (\d+)/)?.[1]);
  const description = status === 401
    ? 'Votre session a expiré. Reconnectez-vous.'
    : status === 403
      ? 'Votre compte ne dispose pas du rôle administrateur requis. Déconnectez-vous puis reconnectez-vous avec le compte administrateur.'
      : status === 404
        ? 'Cette fonction n’est pas encore disponible sur l’API déployée. Déployez le dernier commit sur Render.'
        : 'Vérifiez votre connexion puis réessayez.';

  return (
    <div role="alert" className="space-y-4 rounded-[24px] border border-red-500/20 bg-[#121416] p-10 text-center text-red-300">
      <p>Impossible de charger ces données. {description}</p>
      {status === 401 && <Link to="/login" className="underline">Se reconnecter</Link>}
      {onRetry && <button type="button" onClick={onRetry} className="mx-auto block rounded-full border border-white/10 px-4 py-2 text-sm text-white">Réessayer</button>}
    </div>
  );
}

export default App;
