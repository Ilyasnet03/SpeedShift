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

Le fichier `render.yaml` configure le frontend comme site statique gratuit et l'API comme service web Docker gratuit. Le frontend appelle l'API publique ; le backend n'autorise que l'origine du frontend configurée.

Le Blueprint crée également une base PostgreSQL gratuite Render ; aucune URL ni aucun mot de passe de base de données n'est à saisir manuellement. **Attention : les bases PostgreSQL gratuites Render expirent après 30 jours.** Pour des données durables, utilisez une base payante ou configurez un fournisseur externe.

1. Sur Render, sélectionnez **New + → Blueprint** et connectez le dépôt GitHub `Ilyasnet03/SpeedShift`.
2. Vérifiez la liste des ressources gratuites (API, site statique, base PostgreSQL), puis sélectionnez **Apply** ou **Deploy Blueprint**.
3. Render génère `JWT_SECRET` et renseigne automatiquement les paramètres de connexion à PostgreSQL.
4. Ouvrez le site statique `speedshift-web` une fois les déploiements terminés.

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
