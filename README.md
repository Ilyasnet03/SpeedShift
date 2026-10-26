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

## Déploiement gratuit sur Render

Le fichier `render.yaml` configure le frontend et le backend comme services Docker gratuits. Le frontend transmet `/api` et `/ws` au backend par le réseau privé Render, sans URL d'API codée en dur ni configuration CORS côté navigateur.

Render ne fournit pas de base PostgreSQL gratuite permanente. Pour garder le déploiement gratuit, créez une base PostgreSQL chez un fournisseur avec une offre gratuite, par exemple [Neon](https://neon.tech/), puis :

1. Sur Render, sélectionnez **New + → Blueprint** et connectez le dépôt GitHub `Ilyasnet03/SpeedShift`.
2. Pendant la synchronisation du Blueprint, renseignez les variables demandées pour l'API :
   - `SPRING_DATASOURCE_URL` : URL JDBC, par exemple `jdbc:postgresql://<hôte-neon>/<base>?sslmode=require` (utilisez l'hôte et la base indiqués par Neon).
   - `SPRING_DATASOURCE_USERNAME` : utilisateur PostgreSQL Neon.
   - `SPRING_DATASOURCE_PASSWORD` : mot de passe PostgreSQL Neon.
3. Laissez Render générer `JWT_SECRET`, puis créez les services.
4. Ouvrez l'URL publique du service `speedshift-web` une fois le déploiement terminé.

Les services web gratuits Render peuvent se mettre en veille après une période d'inactivité. Le premier chargement suivant peut donc prendre un moment. Les offres gratuites des fournisseurs de bases de données ont également leurs propres limites et conditions.

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
