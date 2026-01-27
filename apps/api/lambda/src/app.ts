import { Hono } from "hono";
import { logger } from "hono/logger";
import og from "./routes/og";

const app = new Hono();

app.use("*", logger());

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.route("/", og);

export { app };
