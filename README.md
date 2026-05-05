# WeLoveMovies — Backend Capstone

A RESTful backend for a movie-listing application. Serves data about movies, the theaters they play in, and user reviews. Built with Node.js, Express, Knex, and PostgreSQL.

---

## Tech Stack

- **Runtime:** Node.js 18
- **Framework:** Express 4
- **Query builder:** Knex
- **Database:** PostgreSQL (production) / SQLite3 (local)
- **Testing:** Jest + Supertest
- **Other:** CORS, Morgan, dotenv

---

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/movies` | List all movies (or `?is_showing=true` for currently showing) |
| GET | `/movies/:movieId` | Read a single movie |
| GET | `/movies/:movieId/theaters` | List theaters showing a movie |
| GET | `/movies/:movieId/reviews` | List reviews (with critic) for a movie |
| GET | `/theaters` | List theaters with the movies they show |
| PUT | `/reviews/:reviewId` | Update a review |
| DELETE | `/reviews/:reviewId` | Delete a review |

---

## Setup

```bash
npm install
cp .env.sample .env       # fill DATABASE_URL, etc.
npm run migrate
npm run seed
npm run start:dev         # http://localhost:5001
npm test
```

---

## Project Structure

```
src/
├── app.js                # express app, routers, error handlers
├── server.js             # entry point
├── db/
│   ├── connection.js     # knex instance
│   ├── migrations/       # schema
│   └── seeds/            # demo data
├── movies/               # router + controller + service
├── theaters/
├── reviews/
├── errors/               # asyncErrorBoundary, methodNotAllowed
└── utils/                # map-properties, reduce-properties
```

Each resource follows a router → controller → service layering.

---

## Post-Submission Reflection

### 1. Problem-solving approach

I broke the capstone into three phases: **understand**, **plan**, **build**.

- **Understand requirements.** I read the user stories and the route documentation in `docs/routes/` and `docs/tables/` end-to-end before writing any code. I mapped each user story to a specific endpoint and to the DB tables it would need to touch (e.g., `theaters` listing requires a join through `movies_theaters` to nest movies inside each theater).
- **Plan the schema and layering.** I designed the migration once — five tables (`movies`, `theaters`, `movies_theaters`, `critics`, `reviews`) with the correct foreign keys and `ON DELETE CASCADE` on reviews so a deleted critic or movie does not leave orphan rows. I committed to a router → controller → service layering for every resource so HTTP concerns, validation, and DB queries each had one home.
- **Implement feature by feature.** Movies first (simplest reads), then theaters (introduces the join + nested data shape), then reviews (introduces update/delete and the critic embed). After each route I ran the corresponding test file in `test/routes/` and only moved on once it was green. That gave me a tight feedback loop and stopped regressions from compounding.
- **Polish.** Centralized error handling with an `asyncErrorBoundary` wrapper and a `methodNotAllowed` handler so unsupported methods return `405` instead of leaking through.

### 2. One key technical decision

**Decision: handle the `reviews?critic` embed at the service layer using `Promise.all` rather than a SQL JOIN.**

`GET /movies/:movieId/reviews` must return each review with its full `critic` object nested inside. Two ways to do this:

1. SQL `JOIN reviews ↔ critics`, then reshape each row in JS — collapsing critic columns into a `review.critic = { ... }` object.
2. Fetch reviews in one query, then `Promise.all(reviews.map(setCritic))` to attach the critic per row.

I went with option 2 (see `src/reviews/reviews.service.js:9-14`). The reasoning:

- **Readability.** `setCritic` is one tiny function; the intent is obvious. A JOIN with column aliasing + a JS reducer would cost more lines and bury the intent.
- **Reuse.** `setCritic` is also called from `update()` so a single review returned from `PUT /reviews/:reviewId` is shaped identically. With the JOIN approach I would have needed two separate query paths or a shared reshaper utility.
- **Cardinality.** A movie has tens of reviews, not thousands. The N+1 cost is bounded and dwarfed by network latency on the response. If the dataset grew, I would switch to the JOIN — the service boundary makes that swap local.

The tradeoff I accepted: more round trips to the DB. The win: clearer code and a reusable shaping function.

### 3. AI use disclosure

**Yes.** I used AI tools (Claude / ChatGPT) responsibly during the build:

- **Documentation lookups** — Knex query syntax for joins and `groupBy`, Express middleware ordering, and Jest/Supertest assertion patterns. Faster than tab-hopping the docs.
- **Debugging.** Pasted failing test output and the relevant service function, asked for likely causes. Used the suggestions as hypotheses, not as patches — I read the code path myself before committing any change.
- **Rubber-ducking design.** Talked through the JOIN-vs-`Promise.all` decision above and the cascade rules on the `reviews` foreign keys.

What I did **not** do: paste an entire failing test and ask for a finished implementation, or commit code I did not understand. Every line in the repo is something I can explain and defend.

### 4. Area to strengthen

**Database performance and query optimization.** I leaned on Knex's high-level API and the row counts in this project are small enough that performance never bit me. In a real backend at scale, I want to be the engineer who can read an `EXPLAIN ANALYZE` plan, spot a missing composite index, recognize an N+1, and decide between a join, a subquery, and an in-memory map with confidence. Concretely, my next step is to deepen my SQL fundamentals (window functions, CTEs, indexing strategy) and then revisit this project to benchmark the `reviews` embed under realistic data volumes.

### 5. Optional — Ethical and effective AI use in real backend workflows

I would treat AI tools the same way I treat a senior pair-programmer who is fast but unverified:

- **Debugging.** Use it to generate hypotheses about a stack trace or a flaky test, then verify against the code and the data. Never paste production secrets, customer data, or proprietary internal code into a third-party model — sanitize inputs first.
- **Documentation lookups.** Excellent for "what does this Knex modifier do" or "what's the right way to set up a Postgres `CITEXT` column." Always cross-check anything load-bearing against the official docs, because models confidently hallucinate flag names and version-specific behavior.
- **Brainstorming.** Great for listing approaches and tradeoffs at the design stage — caching strategies, retry policies, schema choices. Treat the output as a menu to evaluate, not a recommendation to follow.
- **Code review assistance.** Useful as a first-pass linter for "what edge cases might I have missed" and "is this error message helpful." Not a replacement for a human reviewer who understands the product context.
- **Boundaries.** I would not let an AI auto-merge to main, write security-sensitive code I do not personally understand, or make architectural decisions on my behalf. Authorship and accountability stay with the engineer.

The principle: **AI accelerates the parts of the job where I already know what good looks like; it does not replace the judgment of knowing.**
