#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { NowplayingApiGwStack } from "@/lib/nowplaying-api-gw-stack";
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../../.env") });

const app = new cdk.App();

const certificateArn = process.env.CERTIFICATE_ARN || "";

if (!certificateArn) {
  throw new Error(`CERTIFICATE_ARN is not set in environment variables`);
}

new NowplayingApiGwStack(app, "NowplayingApiGwStack", {
  env: {
    region: "ap-northeast-1",
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
  crossRegionReferences: true,
  certificateArn: certificateArn,
});
