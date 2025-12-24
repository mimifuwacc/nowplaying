#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { NowplayingApiGwStack } from "@/lib/nowplaying-api-gw-stack";

const app = new cdk.App();
new NowplayingApiGwStack(app, "NowplayingApiGwStack", {
  env: { region: "ap-northeast-1" },
});
