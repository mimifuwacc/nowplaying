#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CertificateStack } from "@/lib/acm-stack";
import { NowplayingApiGwStack } from "@/lib/nowplaying-api-gw-stack";
import * as dotenv from "dotenv";

dotenv.config();

const app = new cdk.App();

const certificateStack = new CertificateStack(app, "CertificateStack", {
  env: {
    region: "us-east-1",
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
  domainName: process.env.PUBLIC_DOMAIN_NAME || "",
});

new NowplayingApiGwStack(app, "NowplayingApiGwStack", {
  env: {
    region: "ap-northeast-1",
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
  crossRegionReferences: true,
  certificateArn: certificateStack.certificate.certificateArn,
});
