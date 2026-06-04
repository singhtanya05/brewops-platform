# BrewOps Single Page Application Frontend

This frontend connects to the Spring Boot REST API (`http://localhost:8080`).

## Running Locally

To avoid Cross-Origin Resource Sharing (CORS) or local routing issues when opening files directly, run a local development web server.

### Option A: Using Python (Recommended)
From this directory, run:
```bash
python3 -m http.server 3000
```
Then navigate to `http://localhost:3000` in your web browser.

### Option B: Using Node.js
If you have Node installed, run:
```bash
npx serve -l 3000
```
Then navigate to `http://localhost:3000` in your web browser.
