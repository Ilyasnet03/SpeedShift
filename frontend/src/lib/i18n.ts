import { create } from 'zustand';

export type Lang = 'fr' | 'en' | 'ar';
export const LANGS: { code: Lang; label: string }[] = [
  { code: 'fr', label: 'FR' },
  { code: 'en', label: 'EN' },
  { code: 'ar', label: 'AR' }
];

const en: Record<string, string> = {
  'Favoris': 'Favorites',
  'Market': 'Market',
  'Mes annonces': 'My listings',
  'Poster une annonce': 'Post a listing',
  'Vendre': 'Sell',
  'Administration': 'Administration',
  'Déconnexion': 'Log out',
  'Connexion': 'Log in',
  'Messages': 'Messages',
  'Comparer': 'Compare',
  'Comparateur': 'Comparison',
  'À propos': 'About',
  'Conseils anti-arnaque': 'Anti-scam tips',
  'Contact': 'Contact',
  'Marketplace premium pour les passionnés de deux-roues, voitures et machines sportives.': 'Premium marketplace for two-wheel, car and sport machine enthusiasts.',
  'Partager': 'Share',
  'Copier le lien': 'Copy link',
  'Lien copié': 'Link copied',
  'Signaler': 'Report',
  'Signaler cette annonce': 'Report this listing',
  'Envoyer le signalement': 'Send report',
  'Signalement envoyé, merci.': 'Report sent, thank you.',
  'Arnaque': 'Scam',
  'Fausse annonce': 'Fake listing',
  'Contenu inapproprié': 'Inappropriate content',
  'Doublon': 'Duplicate',
  'Déjà vendu': 'Already sold',
  'Autre': 'Other',
  'Détails (optionnel)': 'Details (optional)',
  'Annuler': 'Cancel',
  'Avis sur le vendeur': 'Seller reviews',
  'Aucun avis pour le moment.': 'No reviews yet.',
  'Laisser un avis': 'Leave a review',
  'Votre commentaire': 'Your comment',
  'Publier l\'avis': 'Post review',
  'Supprimer mon avis': 'Delete my review',
  'Connectez-vous pour laisser un avis.': 'Log in to leave a review.',
  'Envoyer un message': 'Send a message',
  'Votre message': 'Your message',
  'Envoyer': 'Send',
  'Connectez-vous pour contacter le vendeur.': 'Log in to contact the seller.',
  'Aucune conversation.': 'No conversations.',
  'Écrivez un message…': 'Write a message…',
  'Retour': 'Back',
  'Comparer les annonces': 'Compare listings',
  'Ajoutez jusqu\'à 3 annonces pour les comparer.': 'Add up to 3 listings to compare them.',
  'Maximum 3 annonces dans le comparateur.': 'Maximum 3 listings in the comparator.',
  'Prix': 'Price',
  'Ville': 'City',
  'Année': 'Year',
  'Kilométrage': 'Mileage',
  'Carburant': 'Fuel',
  'Boîte': 'Transmission',
  'Catégorie': 'Category',
  'Retirer': 'Remove',
  'Vider': 'Clear',
  'Près de moi': 'Near me',
  'Rayon': 'Radius',
  'Liste': 'List',
  'Carte': 'Map',
  'Localisation indisponible.': 'Location unavailable.',
  'Statistiques': 'Statistics',
  'Vues': 'Views',
  'Messages reçus': 'Messages received',
  'Partages': 'Shares',
  'Appels': 'Calls',
  'Renouveler': 'Renew',
  'Annonce renouvelée.': 'Listing renewed.',
  'Afficher mon numéro de téléphone': 'Show my phone number',
  'Signalements': 'Reports',
  'Analyses': 'Analytics',
  'Journal d\'audit': 'Audit log',
  'Exporter les utilisateurs (CSV)': 'Export users (CSV)',
  'Exporter les annonces (CSV)': 'Export listings (CSV)',
  'Résoudre': 'Resolve',
  'Rejeter': 'Dismiss',
  'Archiver l\'annonce': 'Archive listing',
  'Aucun signalement.': 'No reports.',
  'Aucune entrée.': 'No entries.'
};

const ar: Record<string, string> = {
  'Favoris': 'المفضلة',
  'Market': 'السوق',
  'Mes annonces': 'إعلاناتي',
  'Poster une annonce': 'نشر إعلان',
  'Vendre': 'بيع',
  'Administration': 'الإدارة',
  'Déconnexion': 'تسجيل الخروج',
  'Connexion': 'تسجيل الدخول',
  'Messages': 'الرسائل',
  'Comparer': 'قارن',
  'Comparateur': 'المقارنة',
  'À propos': 'من نحن',
  'Conseils anti-arnaque': 'نصائح ضد الاحتيال',
  'Contact': 'اتصل بنا',
  'Marketplace premium pour les passionnés de deux-roues, voitures et machines sportives.': 'سوق متميز لعشاق الدراجات والسيارات والآلات الرياضية.',
  'Partager': 'مشاركة',
  'Copier le lien': 'نسخ الرابط',
  'Lien copié': 'تم نسخ الرابط',
  'Signaler': 'إبلاغ',
  'Signaler cette annonce': 'الإبلاغ عن هذا الإعلان',
  'Envoyer le signalement': 'إرسال البلاغ',
  'Signalement envoyé, merci.': 'تم إرسال البلاغ، شكراً.',
  'Arnaque': 'احتيال',
  'Fausse annonce': 'إعلان مزيف',
  'Contenu inapproprié': 'محتوى غير لائق',
  'Doublon': 'مكرر',
  'Déjà vendu': 'تم البيع',
  'Autre': 'أخرى',
  'Détails (optionnel)': 'تفاصيل (اختياري)',
  'Annuler': 'إلغاء',
  'Avis sur le vendeur': 'تقييمات البائع',
  'Aucun avis pour le moment.': 'لا توجد تقييمات بعد.',
  'Laisser un avis': 'اترك تقييماً',
  'Votre commentaire': 'تعليقك',
  'Publier l\'avis': 'نشر التقييم',
  'Supprimer mon avis': 'حذف تقييمي',
  'Connectez-vous pour laisser un avis.': 'سجّل الدخول لترك تقييم.',
  'Envoyer un message': 'إرسال رسالة',
  'Votre message': 'رسالتك',
  'Envoyer': 'إرسال',
  'Connectez-vous pour contacter le vendeur.': 'سجّل الدخول لمراسلة البائع.',
  'Aucune conversation.': 'لا توجد محادثات.',
  'Écrivez un message…': 'اكتب رسالة…',
  'Retour': 'رجوع',
  'Comparer les annonces': 'مقارنة الإعلانات',
  'Ajoutez jusqu\'à 3 annonces pour les comparer.': 'أضف حتى 3 إعلانات لمقارنتها.',
  'Maximum 3 annonces dans le comparateur.': 'الحد الأقصى 3 إعلانات في المقارنة.',
  'Prix': 'السعر',
  'Ville': 'المدينة',
  'Année': 'السنة',
  'Kilométrage': 'المسافة المقطوعة',
  'Carburant': 'الوقود',
  'Boîte': 'ناقل الحركة',
  'Catégorie': 'الفئة',
  'Retirer': 'إزالة',
  'Vider': 'مسح',
  'Près de moi': 'بالقرب مني',
  'Rayon': 'النطاق',
  'Liste': 'قائمة',
  'Carte': 'خريطة',
  'Localisation indisponible.': 'الموقع غير متاح.',
  'Statistiques': 'الإحصائيات',
  'Vues': 'المشاهدات',
  'Messages reçus': 'الرسائل المستلمة',
  'Partages': 'المشاركات',
  'Appels': 'المكالمات',
  'Renouveler': 'تجديد',
  'Annonce renouvelée.': 'تم تجديد الإعلان.',
  'Afficher mon numéro de téléphone': 'إظهار رقم هاتفي',
  'Signalements': 'البلاغات',
  'Analyses': 'التحليلات',
  'Journal d\'audit': 'سجل التدقيق',
  'Exporter les utilisateurs (CSV)': 'تصدير المستخدمين (CSV)',
  'Exporter les annonces (CSV)': 'تصدير الإعلانات (CSV)',
  'Résoudre': 'حل',
  'Rejeter': 'رفض',
  'Archiver l\'annonce': 'أرشفة الإعلان',
  'Aucun signalement.': 'لا توجد بلاغات.',
  'Aucune entrée.': 'لا توجد إدخالات.'
};

const dictionaries: Record<Lang, Record<string, string>> = { fr: {}, en, ar };

const stored = (): Lang => {
  const value = typeof localStorage !== 'undefined' ? localStorage.getItem('speedshift-lang') : null;
  return value === 'en' || value === 'ar' ? value : 'fr';
};

type LangState = { lang: Lang; setLang: (lang: Lang) => void };

export const useLangStore = create<LangState>((set) => ({
  lang: stored(),
  setLang: (lang) => {
    localStorage.setItem('speedshift-lang', lang);
    set({ lang });
  }
}));

export function translate(lang: Lang, text: string): string {
  return dictionaries[lang][text] ?? text;
}

export function useT() {
  const lang = useLangStore((state) => state.lang);
  return (text: string) => translate(lang, text);
}
