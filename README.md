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
