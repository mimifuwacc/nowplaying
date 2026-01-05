import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface NowplayingApiGwStackProps extends cdk.StackProps {
  certificateArn?: string;
}

export class NowplayingApiGwStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: NowplayingApiGwStackProps) {
    super(scope, id, props);

    const assetsLayer = new lambda.LayerVersion(this, "AssetsLayer", {
      compatibleRuntimes: [lambda.Runtime.NODEJS_22_X],
      code: lambda.Code.fromAsset(path.join(__dirname, "../layer")),
      description: "Noto Sans JP font for OG image generation",
    });

    const nativeModulesLayer = new lambda.LayerVersion(this, "NativeModulesLayer", {
      compatibleRuntimes: [lambda.Runtime.NODEJS_22_X],
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda-build/nodejs-modules.zip")),
      description: "Native modules built for Lambda",
    });

    const nowplayingApiLambda = new lambda.Function(this, "lambda", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/dist")),
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
      layers: [assetsLayer, nativeModulesLayer],
      environment: {},
    });

    const functionUrl = nowplayingApiLambda.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ["*"],
        allowedMethods: [lambda.HttpMethod.GET],
        allowedHeaders: ["*"],
      },
    });

    const cachePolicy = new cloudfront.CachePolicy(this, "CachePolicy", {
      cachePolicyName: "NowplayingCachePolicy",
      comment: "Cache policy for API responses with query parameters",
      defaultTtl: cdk.Duration.minutes(5),
      minTtl: cdk.Duration.minutes(1),
      maxTtl: cdk.Duration.hours(1),
      cookieBehavior: cloudfront.CacheCookieBehavior.none(),
      headerBehavior: cloudfront.CacheHeaderBehavior.none(),
      queryStringBehavior: cloudfront.CacheQueryStringBehavior.all(),
    });

    let certificate: acm.ICertificate | undefined;

    if (props?.certificateArn) {
      certificate = acm.Certificate.fromCertificateArn(this, "Certificate", props.certificateArn);
    }

    const distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: new origins.HttpOrigin(cdk.Fn.select(2, cdk.Fn.split("/", functionUrl.url)), {
          originSslProtocols: [cloudfront.OriginSslPolicy.TLS_V1_2],
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cachePolicy,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
      },
      ...(certificate && {
        domainNames: ["np.mimifuwa.cc"],
        certificate: certificate,
      }),
    });

    new cdk.CfnOutput(this, "CloudFrontUrl", {
      value: `https://${distribution.distributionDomainName}`,
      description: "CloudFront Distribution Url",
    });

    new cdk.CfnOutput(this, "FunctionUrl", {
      value: functionUrl.url,
      description: "Lambda Function URL",
    });
  }
}
