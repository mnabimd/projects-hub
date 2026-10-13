# ProjectsHub API

REST API for **ProjectsHub** — the single backend serving the student web portal, admin panel and mobile app.

## Stack

- Node.js + Express
- MongoDB + Mongoose
- JWT auth (Passport)
- Joi validation
- Swagger docs (`/v1/docs` in development)
- Jest + Supertest

## Getting started

```bash
# install dependencies
npm install

# create your env file and fill in the values
cp .env.example .env

# run in development (nodemon)
npm run dev
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server with nodemon |
| `npm start` | Start in production with PM2 |
| `npm test` | Run tests |
| `npm run coverage` | Run tests with coverage |
| `npm run lint` / `npm run lint:fix` | Lint the code |
| `npm run prettier` / `npm run prettier:fix` | Check / fix formatting |
| `npm run docker:dev` | Run with Docker (development) |
| `npm run test:bruno` | Run the Bruno API test suite via CLI |

## In-IDE API Testing (Bruno)

The API includes a version-controlled [Bruno](https://www.usebruno.com/) collection in `apps/api/bruno/` for testing endpoints directly inside your IDE without needing Postman or third-party cloud accounts.

### 1. Open in IDE
1. Open the Bruno extension in your IDE sidebar.
2. Click **Open Collection** and select the [`apps/api/bruno`](./bruno) directory.
3. Select the **Local** environment from the top-right environment picker (`baseUrl: http://localhost:4500/v1`).

### 2. Authentication Auto-Chaining
- Running **Auth > Login** or **Auth > Register** automatically extracts the JWT access token and saves it to runtime collection variables (`accessToken`, `refreshToken`, `userId`).
- Protected endpoints (like User management) automatically inherit the Bearer token via `collection.bru`.
- Admin-protected endpoints can be tested by logging in via **Auth > Login (Admin)**.

### 3. Running tests via CLI
You can run all endpoint assertions headlessly:
```bash
npm run test:bruno
```

## Project structure

```
src/
├── config/        # Environment & app configuration
├── controllers/   # Route controllers
├── docs/          # Swagger definitions
├── middlewares/   # Express middlewares
├── models/        # Mongoose models
├── routes/        # API routes (v1)
├── services/      # Business logic
├── utils/         # Helpers
├── validations/   # Joi request schemas
├── app.js         # Express app
└── index.js       # Entry point
```

## Credits

Based on [node-express-boilerplate](https://github.com/hagopj13/node-express-boilerplate) by Hagop Jamkojian (MIT). See [LICENSE](./LICENSE).
