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
5. Vérifiez `https://speedshift-api.onrender.com/api/health`, puis ouvrez le site statique `speedshift-web`.

Les services web gratuits Render peuvent se mettre en veille après une période d'inactivité. Le premier appel à l'API peut donc prendre un moment. Si Render attribue des sous-domaines différents, mettez à jour `VITE_API_BASE_URL` et `FRONTEND_URL` dans `render.yaml`, puis redéployez.

## Fonctionnalités de démonstration incluses

- Page d'accueil premium avec hero et catégories
- Catalogue avec recherche, tri et filtres
- Fiche annonce détaillée
- Formulaire de publication
- Back-office admin
- API REST avec données de démonstration
- Dockerisation complète

## Notes

Le projet a été conçu comme une base fonctionnelle et démonstrative, prête à être étendue avec authentification JWT, gestion avancée des utilisateurs, messagerie temps réel et modération complète.
