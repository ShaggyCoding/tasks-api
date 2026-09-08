# Tasks API

Kleine, sauber dokumentierte REST-API für Notizen/Aufgaben: E-Mail/Passwort-Auth mit
JWT, paginierte und durchsuchbare Listen, jede Notiz gehört genau einem Nutzer.
Gebaut, um Backend-Grundlagen unabhängig von einem konkreten Gaming-/RP-Kontext zu
zeigen — mit Tests, CI und einer interaktiven API-Doku.

## Funktionen

- Registrierung/Login per E-Mail + Passwort (bcrypt-Hash, nie im Klartext gespeichert)
- JWT-Auth (Bearer-Token, 2 Stunden gültig)
- Notizen: erstellen, lesen, teilweise aktualisieren (PATCH), löschen — strikt pro Nutzer isoliert
- Pagination (`page`/`pageSize`) mit Gesamtanzahl und Seitenzahl in der Antwort
- Volltextsuche über den Titel (`?search=`)
- Interaktive API-Doku unter `/docs` (Swagger UI), Rohspezifikation unter `/openapi.yaml`
- Zentrales Fehler-Handling mit einheitlichem `{ "error": "..." }`-Format

## Tech-Stack

- Node.js + Express + TypeScript (strict mode)
- PostgreSQL (`pg`, kein ORM — rohes SQL mit parametrisierten Queries)
- Zod für Request-Validierung
- Vitest + Supertest für Integrationstests (laufen gegen eine echte Postgres-Instanz)
- Docker + Docker Compose für lokale Entwicklung und Deployment
- GitHub Actions: Typecheck, Build, Tests (mit Postgres-Service-Container) und Docker-Build bei jedem Push/PR

## Einrichtung

### Mit Docker Compose (empfohlen)

```bash
docker compose up --build
```

Startet Postgres und die API zusammen. Die API läuft danach auf
`http://localhost:3000`, die Doku auf `http://localhost:3000/docs`.

### Lokal ohne Docker

Voraussetzung: eine laufende Postgres-Instanz.

```bash
npm install
copy .env.example .env
# .env anpassen: DATABASE_URL auf die eigene Postgres-Instanz zeigen lassen
npm run dev
```

## Tests

```bash
npm test
```

Die Tests brauchen eine erreichbare Postgres-Instanz unter `DATABASE_URL` (z.B. per
`docker compose up db`) — sie legen ihr Schema selbst an und leeren die Tabellen vor
jedem Testfall.

## Architektur

- `src/index.ts` — Einstiegspunkt: migriert das Schema, startet den Server
- `src/app.ts` — Express-App-Factory (getrennt von `index.ts`, damit Tests die App
  ohne offenen Port testen können)
- `src/db.ts` — Connection-Pool + idempotentes Schema (`CREATE TABLE IF NOT EXISTS`)
- `src/routes/auth.ts` — Registrierung/Login
- `src/routes/notes.ts` — CRUD + Pagination + Suche, alles hinter `requireAuth`
- `src/routes/docs.ts` — liefert `openapi.yaml` roh und über Swagger UI aus
- `src/middleware/auth.ts` — prüft den Bearer-Token, hängt den Nutzer an `req.user`
- `src/middleware/validate.ts` — validiert `req.body` gegen ein Zod-Schema
- `src/middleware/error.ts` — zentrales Error-Handling (`HttpError` → passender
  Statuscode, alles andere → 500 ohne Interna nach außen zu geben)
- `openapi.yaml` — von Hand gepflegte OpenAPI-3.0-Spezifikation

## Sicherheit

- Passwörter werden ausschließlich als bcrypt-Hash gespeichert, nie im Klartext oder in Logs
- Notizen sind strikt pro Nutzer isoliert (jede Query filtert zusätzlich nach `user_id`) —
  fremde IDs liefern `404`, nicht `403`, um nicht zu verraten, dass die ID existiert
- Alle SQL-Queries sind parametrisiert (kein String-Concatenation), verhindert SQL-Injection
- Zentrales Error-Handling gibt bei unerwarteten Fehlern nie Stacktraces oder interne
  Details nach außen
