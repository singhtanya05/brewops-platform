# BrewOps Platform

An enterprise-scale cafe storefront and kitchen management system built with Spring Boot and Next.js.

## How to Start the Project (Local Development)

To run the entire platform locally, you need to start the **Backend Infrastructure** via Docker, and the **Frontend** via NPM. 

Open two separate terminal windows and follow these steps:

### 1. Start the Backend Infrastructure (Terminal 1)
This will start your Spring Boot API, PostgreSQL Database, and Redis Cache.
```bash
cd infrastructure/docker
docker-compose up -d --build
```
*(You can view live backend logs by running: `docker logs -f brewops-backend`)*

### 2. Start the Frontend (Terminal 2)
This starts the Next.js React frontend with Hot Module Replacement (HMR) for lightning-fast UI development.
```bash
cd frontend-next
npm run dev
```

### 3. View the App!
Once both are running, open your web browser:
- **Storefront / App:** [http://localhost:3000](http://localhost:3000)
- **Backend API Docs (Swagger):** [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
