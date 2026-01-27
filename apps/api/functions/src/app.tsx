import { Hono } from "hono";
import { logger } from "hono/logger";
import og from "./routes/og";
import redirect from "./routes/redirect";

const app = new Hono();

app.use("*", logger());

app.use("*", async (c, next) => {
  c.setRenderer((content) => {
    return c.html(
      <html>
        <head></head>
        <body>{content}</body>
      </html>
    );
  });
  await next();
});

app.route("/og", og);
app.route("/", redirect);

export { app };
