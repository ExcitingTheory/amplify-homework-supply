/**
 * CfKeyRotation CDK Construct
 *
 * CloudFormation Custom Resource that auto-generates an RSA-2048 key pair and
 * writes it to SSM **before** the CloudFront distribution is created or updated.
 *
 * How it works:
 *  - A small inline Lambda (cfKeyRotationFn) is invoked by CloudFormation as a
 *    CustomResource during every stack deploy.
 *  - On first deploy: generates key pair, writes to SSM (Overwrite: false).
 *  - On subsequent deploys: no-op unless `forceRotate` is explicitly set.
 *  - On DELETE: retains SSM parameters (never auto-deletes key material).
 *
 * The construct exposes:
 *  - `publicKeyParamName`  — SSM param holding the public key PEM (String)
 *  - `privateKeyParamName` — SSM param holding the private key PEM (SecureString)
 *
 * Usage in backend.ts:
 *   const keyRotation = new CfKeyRotationConstruct(stack, 'CfKeyRotation');
 *   const mediaCDN = new MediaCDNConstruct(stack, 'MediaCDN', {
 *     bucket: backend.storage.resources.bucket,
 *     cfPublicKeyParamName: keyRotation.publicKeyParamName,
 *   });
 *   // Add explicit CDK dependency so key pair is written before the distribution
 *   mediaCDN.node.addDependency(keyRotation);
 */

import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction, OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as cr from "aws-cdk-lib/custom-resources";
import * as logs from "aws-cdk-lib/aws-logs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface CfKeyRotationConstructProps {
  /**
   * SSM path prefix. Defaults to "/homework-supply/cloudfront".
   * Keys are written at:
   *   {prefix}/public-key   (String)
   *   {prefix}/private-key  (SecureString)
   */
  ssmPrefix?: string;

  /**
   * When true, forces key pair rotation on every deploy by setting
   * forceRotate=true in the custom resource properties.
   * Default: false (keys are only written on first deploy).
   */
  forceRotate?: boolean;
}

export class CfKeyRotationConstruct extends Construct {
  /** SSM parameter name for the RSA public key PEM (String) */
  public readonly publicKeyParamName: string;

  /** SSM parameter name for the RSA private key PEM (SecureString) */
  public readonly privateKeyParamName: string;

  /** The Lambda function backing the custom resource */
  public readonly providerFn: lambda.Function;

  /** The public key PEM as a CDK token (resolved at deploy time from custom resource output) */
  public readonly publicKeyPem: string;

  constructor(scope: Construct, id: string, props: CfKeyRotationConstructProps = {}) {
    super(scope, id);

    const {
      ssmPrefix = "/homework-supply/cloudfront",
      forceRotate = false,
    } = props;

    this.publicKeyParamName = `${ssmPrefix}/public-key`;
    this.privateKeyParamName = `${ssmPrefix}/private-key`;

    // -----------------------------------------------------------------------
    // IAM role for the key-rotation Lambda
    // -----------------------------------------------------------------------
    const role = new iam.Role(this, "HandlerRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole",
        ),
      ],
    });

    // Grant SSM put/get on the two specific parameters
    role.addToPolicy(
      new iam.PolicyStatement({
        actions: ["ssm:PutParameter", "ssm:GetParameter"],
        resources: [
          cdk.Arn.format(
            { service: "ssm", resource: "parameter", resourceName: this.publicKeyParamName.replace(/^\//, "") },
            cdk.Stack.of(this),
          ),
          cdk.Arn.format(
            { service: "ssm", resource: "parameter", resourceName: this.privateKeyParamName.replace(/^\//, "") },
            cdk.Stack.of(this),
          ),
        ],
      }),
    );

    // KMS permission is needed so the Lambda can write the SecureString without
    // explicitly providing a KMS key (uses the SSM-managed default key).
    role.addToPolicy(
      new iam.PolicyStatement({
        actions: ["kms:GenerateDataKey", "kms:Decrypt"],
        resources: ["*"],
        conditions: {
          StringEquals: {
            "kms:ViaService": `ssm.${cdk.Stack.of(this).region}.amazonaws.com`,
          },
        },
      }),
    );

    // -----------------------------------------------------------------------
    // Lambda function (Node 22, bundled from TypeScript via esbuild)
    // -----------------------------------------------------------------------
    this.providerFn = new NodejsFunction(this, "Handler", {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, "handler.ts"),
      handler: "handler",
      role,
      timeout: cdk.Duration.minutes(1),
      description: "CloudFormation CR — generates CloudFront RSA key pair and writes to SSM",
      logRetention: logs.RetentionDays.ONE_WEEK,
      bundling: {
        format: OutputFormat.ESM,
        mainFields: ["module", "main"],
        banner: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
      },
    });

    // -----------------------------------------------------------------------
    // Custom resource provider + resource
    // -----------------------------------------------------------------------
    const provider = new cr.Provider(this, "Provider", {
      onEventHandler: this.providerFn,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    const customResource = new cdk.CustomResource(this, "Resource", {
      serviceToken: provider.serviceToken,
      properties: {
        // Changing any property triggers an UPDATE event in the Lambda.
        // Use forceRotate=true to rotate the key pair.
        forceRotate: forceRotate ? "true" : "false",
        // Include the param paths so updates re-trigger if they change.
        publicKeyParamName: this.publicKeyParamName,
        privateKeyParamName: this.privateKeyParamName,
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Expose the public key PEM as a deploy-time token from the custom resource output.
    // This avoids using ssm.StringParameter.valueForStringParameter() which creates a
    // {{resolve:ssm:...}} dynamic reference that fails on first deploy (before the
    // custom resource creates the parameter).
    this.publicKeyPem = customResource.getAttString("PublicKeyPem");
  }
}
