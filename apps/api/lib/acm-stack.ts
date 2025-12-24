import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as acm from "aws-cdk-lib/aws-certificatemanager";

interface CertificateStackProps extends cdk.StackProps {
  domainName: string;
}

export class CertificateStack extends cdk.Stack {
  public readonly certificate: acm.Certificate;

  constructor(scope: Construct, id: string, props: CertificateStackProps) {
    super(scope, id, props);

    this.certificate = new acm.Certificate(this, "Certificate", {
      domainName: props.domainName,
      validation: acm.CertificateValidation.fromDns(),
    });

    new cdk.CfnOutput(this, "CertificateArn", {
      value: this.certificate.certificateArn,
      description: "ACM Certificate ARN (us-east-1)",
    });

    new cdk.CfnOutput(this, "DomainName", {
      value: props.domainName,
      description: "Domain name for the certificate",
    });
  }
}
