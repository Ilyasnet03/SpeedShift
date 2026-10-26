# SpeedShift

SpeedShift est une marketplace premium pour motos, voitures, jet-skis, quads et équipements associés. Ce dépôt contient une base fonctionnelle complète basée sur une stack React + TypeScript + Vite + Tailwind pour le frontend, et Java Spring Boot + PostgreSQL + Flyway pour le backend.

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Zustand, Framer Motion, Lucide
- Backend: Java 17, Spring Boot 3, Spring Security, JPA/Hibernate, Flyway, PostgreSQL
- Infrastructure: Docker + docker-compose, Redis

## Démarrage rapide

1. Copiez le fichier `.env.example` vers `.env` et ajustez selon votre environnement.
2. Démarrez les services de base :
   ```bash
   docker compose up --build
   ```
3. Accédez à :
   - Frontend: http://localhost:5173
   - Backend: http://localhost:8080/api/health
   - Swagger UI: http://localhost:8080/swagger-ui.html

## Développement local

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
mvn test
mvn spring-boot:run
```

Le backend attend PostgreSQL sur `localhost:5432` par défaut. Le profil `test` utilise H2 pour les tests automatisés.

## Déploiement gratuit sur Render avec Neon

Le fichier `render.yaml` configure le frontend comme site statique gratuit et l'API comme service web Docker gratuit. Le frontend appelle l'API publique ; le backend n'autorise que l'origine du frontend configurée.

Le Blueprint conserve une base PostgreSQL Render de secours, mais l'API utilise Neon via `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME` et `SPRING_DATASOURCE_PASSWORD`. Ces variables ne sont pas synchronisées depuis le dépôt afin que les identifiants restent configurés dans le tableau de bord Render. La base Render gratuite expire après 30 jours : elle ne doit être supprimée qu'après vérification des données à conserver.

1. Sur Render, sélectionnez **New + → Blueprint** et connectez le dépôt GitHub `Ilyasnet03/SpeedShift`.
2. Vérifiez les ressources, puis sélectionnez **Apply** ou **Deploy Blueprint**. Render génère `JWT_SECRET` et configure sa base de secours.
3. Dans le service `speedshift-api`, ouvrez **Environment** et renseignez les variables suivantes avec les informations de connexion Neon :
   - `SPRING_DATASOURCE_URL` : `jdbc:postgresql://<hôte-pooler-Neon>/neondb?sslmode=require`
   - `SPRING_DATASOURCE_USERNAME` : le rôle Neon indiqué par Neon
   - `SPRING_DATASOURCE_PASSWORD` : le mot de passe de ce rôle
4. Utilisez l'hôte de connexion **pooled** de Neon et conservez `sslmode=require`. Saisissez les secrets uniquement dans Render, jamais dans Git ou dans le chat. Render redéploie l'API après l'enregistrement.
5. Renseignez également `ADMIN_EMAIL` avec l'adresse du compte qui doit gérer la modération. Ce compte obtient le rôle administrateur lors de sa prochaine connexion ; les inscriptions ordinaires restent des comptes client.
6. Vérifiez `https://speedshift-api.onrender.com/api/health`, puis ouvrez le site statique `speedshift-web`.

Les services web gratuits Render peuvent se mettre en veille après une période d'inactivité. Le premier appel à l'API peut donc prendre un moment. Si Render attribue des sous-domaines différents, mettez à jour `VITE_API_BASE_URL` et `FRONTEND_URL` dans `render.yaml`, puis redéployez.

## Fonctionnalités de démonstration incluses

- Page d'accueil premium avec hero et catégories
- Catalogue avec recherche, tri et filtres
- Accès au marché réservé aux utilisateurs connectés ; modération des annonces réservée aux administrateurs
- Publication d'annonces avec validation avant affichage sur le marché
- Fiche annonce détaillée
- Formulaire de publication
- Back-office admin avec statistiques, gestion des utilisateurs (rôles et suspension) et modération/suppression des annonces
- Espace « Mes annonces » avec suppression limitée aux annonces du compte connecté
- Numéros de téléphone marocains (+212) et prix affichés en dirhams (DH)
- Thème clair/sombre mémorisé et navigation adaptée au mobile
- Ajout de jusqu’à 5 photos depuis l’appareil, avec redimensionnement avant envoi
- API REST avec données de démonstration
- Dockerisation complète

## Notes

Les migrations Flyway `V4` et `V5` localisent les annonces de démonstration au Maroc, convertissent leurs prix en DH selon un taux fixe d’exemple de 1 EUR = 10,8 DH, et relient les annonces à leur propriétaire. Elles ne convertissent pas les prix saisis par les utilisateurs. Les utilisateurs peuvent supprimer uniquement leurs annonces ; un administrateur peut supprimer n’importe quelle annonce. Si les sections admin retournent une erreur 403, reconnectez-vous avec le compte configuré dans `ADMIN_EMAIL` pour renouveler son rôle dans le jeton.

La migration `V4` élargit également le stockage des photos : celles envoyées depuis le téléphone sont redimensionnées et enregistrées avec l’annonce dans PostgreSQL, où elles restent disponibles après redémarrage du service.
