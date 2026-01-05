import { handle, defaultIsContentTypeBinary } from "hono/aws-lambda";
import { app } from "./src/app";

// Hono AWS Lambdaアダプタを使用
// image/* をバイナリとして扱う
export const handler = handle(app, {
  isContentTypeBinary: (contentType) => {
    return defaultIsContentTypeBinary(contentType) || contentType.startsWith("image/");
  },
});
