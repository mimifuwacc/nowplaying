import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

interface NowplayingApiGwStackProps extends cdk.StackProps {
  certificateArn?: string;
}

export class NowplayingApiGwStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: NowplayingApiGwStackProps) {
    super(scope, id, props);

    const nowplayingApiLambda = new NodejsFunction(this, "lambda", {
      entry: "lambda/index.ts",
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_22_X,
      environment: {},
    });

    const api = new apigw.LambdaRestApi(this, "nowplayingApi", {
      endpointExportName: "nowplayingApi",
      handler: nowplayingApiLambda,
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
      enableAcceptEncodingGzip: true,
      enableAcceptEncodingBrotli: true,
    });

    let certificate: acm.ICertificate | undefined;

    if (props?.certificateArn) {
      certificate = acm.Certificate.fromCertificateArn(this, "Certificate", props.certificateArn);
    }

    const distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: new origins.RestApiOrigin(api),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cachePolicy,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
      },
      ...(certificate && {
        domainNames: ["np.mimifuwa.cc"],
        certificate: certificate,
      }),
      // defaultRootObject: "/",
    });

    new cdk.CfnOutput(this, "CloudFrontDomainName", {
      value: distribution.distributionDomainName,
      description: "CloudFront Distribution Domain Name",
    });

    new cdk.CfnOutput(this, "ApiUrl", {
      value: api.url,
      description: "API Gateway Endpoint URL",
    });
  }
}
