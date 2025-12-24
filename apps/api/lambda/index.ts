import { handle } from "hono/aws-lambda";
import { app } from "./src/app";

export const handler = handle(app);
