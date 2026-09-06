/**
 * CDK Construct: Custom Resource that applies AppSync syncConfig to DynamoDB
 * resolvers with rate-limited batching (avoids 429s during stack creation).
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

export interface ApplySyncConfigConstructProps {
  /** The AppSync GraphQL API ID */
  apiId: string;
  /** AWS region */
  region: string;
}

export class ApplySyncConfigConstruct extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: ApplySyncConfigConstructProps,
  ) {
    super(scope, id);

    const role = new iam.Role(this, "HandlerRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole",
        ),
      ],
    });

    role.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "appsync:ListDataSources",
          "appsync:UpdateDataSource",
          "appsync:ListResolvers",
          "appsync:UpdateResolver",
        ],
        resources: [
          cdk.Arn.format(
            {
              service: "appsync",
              resource: "apis",
              resourceName: props.apiId,
            },
            cdk.Stack.of(this),
          ),
          cdk.Arn.format(
            {
              service: "appsync",
              resource: "apis",
              resourceName: `${props.apiId}/*`,
            },
            cdk.Stack.of(this),
          ),
        ],
      }),
    );

    const fn = new NodejsFunction(this, "Handler", {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, "handler.ts"),
      handler: "handler",
      role,
      timeout: cdk.Duration.minutes(10),
      description:
        "Applies AppSync syncConfig to DynamoDB resolvers with rate limiting",
      logRetention: logs.RetentionDays.ONE_WEEK,
      bundling: {
        format: OutputFormat.ESM,
        mainFields: ["module", "main"],
        banner:
          "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
      },
    });

    const provider = new cr.Provider(this, "Provider", {
      onEventHandler: fn,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    new cdk.CustomResource(this, "Resource", {
      serviceToken: provider.serviceToken,
      properties: {
        ApiId: props.apiId,
        // Force re-run on every deploy to catch new resolvers
        Timestamp: Date.now().toString(),
      },
    });
  }
}
