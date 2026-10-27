import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/error.js";
import eventsRouter from "./routes/events.routes.js";
import bookingsRouter from "./routes/bookings.routes.js";

const app = express();

// Body parsing (throws -> central error handler turns malformed JSON into 400).
app.use(express.json());

// CORS restricted to the frontend origin configured in .env.
app.use(cors({ origin: env.FRONTEND_URL }));

// Lightweight health check handy for Render deployments.
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Thin routes; business logic lives in the services layer.
app.use("/events", eventsRouter);
app.use("/bookings", bookingsRouter);

// 404 + central error handler must be registered last.
app.use(notFound);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Event booking API listening on http://localhost:${env.PORT}`);
});
