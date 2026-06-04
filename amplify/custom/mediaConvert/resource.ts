/**
 * MediaConvert CDK Construct
 *
 * Sets up the AWS infrastructure for HLS transcoding:
 * 1. IAM service role for MediaConvert to read/write S3
 * 2. EventBridge rule to catch MediaConvert job COMPLETE/ERROR events
 * 3. IAM policies for the handler Lambda (MediaConvert + iam:PassRole)
 *
 * Usage in backend.ts:
 *   const mc = new MediaConvertConstruct(stack, 'MediaConvert', {
 *     bucket: backend.storage.resources.bucket,
 *     handlerLambda: backend.mediaConvertHandler.resources.lambda,
 *   });
 */

import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";

export interface MediaConvertConstructProps {
  /** The Amplify storage S3 bucket */
  bucket: s3.IBucket;
  /** The Lambda function that handles MediaConvert events */
  handlerLambda: lambda.IFunction;
}

export class MediaConvertConstruct extends Construct {
  /** IAM role that MediaConvert assumes to access S3 */
  public readonly mediaConvertRole: iam.Role;

  constructor(scope: Construct, id: string, props: MediaConvertConstructProps) {
    super(scope, id);

    const { bucket, handlerLambda } = props;

    // -----------------------------------------------------------------
    // IAM Role for the MediaConvert service principal
    // -----------------------------------------------------------------
    this.mediaConvertRole = new iam.Role(this, "MediaConvertServiceRole", {
      assumedBy: new iam.ServicePrincipal("mediaconvert.amazonaws.com"),
      description:
        "Allows AWS MediaConvert to read source files and write HLS output to S3",
    });

    // Grant S3 access via role policy (not bucket.grant*) to avoid cross-stack
    // circular dependency between storage and data nested stacks.
    this.mediaConvertRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject", "s3:GetBucketLocation", "s3:ListBucket"],
        resources: [bucket.bucketArn, bucket.arnForObjects("*")],
      }),
    );
    this.mediaConvertRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["s3:PutObject", "s3:PutObjectAcl", "s3:AbortMultipartUpload"],
        resources: [bucket.arnForObjects("*")],
      }),
    );

    // -----------------------------------------------------------------
    // EventBridge rule — fires when a MediaConvert job completes or errors
    // -----------------------------------------------------------------
    const jobStateRule = new events.Rule(this, "MediaConvertJobStateRule", {
      description:
        "Routes MediaConvert COMPLETE/ERROR events to the handler Lambda",
      eventPattern: {
        source: ["aws.mediaconvert"],
        detailType: ["MediaConvert Job State Change"],
        detail: {
          status: ["COMPLETE", "ERROR"],
        },
      },
    });

    jobStateRule.addTarget(new targets.LambdaFunction(handlerLambda));

    // -----------------------------------------------------------------
    // IAM permissions for the handler Lambda
    // -----------------------------------------------------------------

    // MediaConvert API access
    handlerLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "mediaconvert:CreateJob",
          "mediaconvert:GetJob",
          "mediaconvert:DescribeEndpoints",
        ],
        resources: ["*"], // MediaConvert doesn't support resource-level restrictions
      }),
    );

    // iam:PassRole so the Lambda can tell MediaConvert which role to assume
    handlerLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["iam:PassRole"],
        resources: [this.mediaConvertRole.roleArn],
      }),
    );

    // S3 read access via role policy (not bucket.grant*) to avoid cross-stack
    // circular dependency between storage and data nested stacks.
    handlerLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject", "s3:GetBucketLocation", "s3:ListBucket"],
        resources: [bucket.bucketArn, bucket.arnForObjects("*")],
      }),
    );
  }
}
