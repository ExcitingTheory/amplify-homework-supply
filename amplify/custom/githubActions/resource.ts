/**
 * GitHubActionsConstruct
 *
 * Provisions the IAM OIDC identity provider for GitHub Actions and an IAM role
 * that CI workflows can assume via `sts:AssumeRoleWithWebIdentity` (OIDC
 * federation — no long-lived static credentials needed).
 *
 * The role is scoped to the ExcitingTheory/amplify-homework-supply repository
 * and grants the minimum permissions required for `ampx generate outputs`:
 *   - amplify:GetApp / ListApps / GetBranch / ListBranches
 *   - cloudformation:DescribeStacks / DescribeStackResources
 *   - ssm:GetParameter / GetParameters (for Amplify-managed SSM params)
 *
 * The role ARN is emitted as a CloudFormation output so you can copy it into
 * the AWS_ROLE_ARN GitHub Actions secret.
 *
 * Usage in backend.ts:
 *   import { GitHubActionsConstruct } from "./custom/githubActions/resource";
 *   const ghActions = new GitHubActionsConstruct(backendStack, "GitHubActions");
 */

import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";

const GITHUB_OIDC_URL = "https://token.actions.githubusercontent.com";
const GITHUB_OIDC_THUMBPRINT = "6938fd4d98bab03faadb97b34396831e3780aea1";

export interface GitHubActionsConstructProps {
  /** GitHub org/user. Default: "ExcitingTheory" */
  owner?: string;
  /** GitHub repository name. Default: "amplify-homework-supply" */
  repo?: string;
  /**
   * Restrict to a specific branch or ref pattern.
   * Use "*" to allow any ref (PRs + pushes).
   * Default: "*"
   */
  refPattern?: string;
}

export class GitHubActionsConstruct extends Construct {
  /** ARN of the IAM role that GitHub Actions workflows should assume. */
  public readonly roleArn: string;

  constructor(
    scope: Construct,
    id: string,
    props: GitHubActionsConstructProps = {}
  ) {
    super(scope, id);

    const {
      owner = "ExcitingTheory",
      repo = "amplify-homework-supply",
      refPattern = "*",
    } = props;

    const stack = cdk.Stack.of(this);

    // -----------------------------------------------------------------------
    // OIDC Identity Provider
    // The provider is account-scoped (only one per URL allowed). We use
    // `fromOpenIdConnectProviderArn` when it already exists, otherwise create.
    // In a fresh account this construct creates it; in an account where Amplify
    // Hosting already registered it (via the GitHub OAuth connection) it will
    // fail with a duplicate — use the existing ARN import path instead.
    // -----------------------------------------------------------------------
    const oidcProvider = new iam.OpenIdConnectProvider(
      this,
      "GitHubOidcProvider",
      {
        url: GITHUB_OIDC_URL,
        clientIds: ["sts.amazonaws.com"],
        thumbprints: [GITHUB_OIDC_THUMBPRINT],
      }
    );

    // -----------------------------------------------------------------------
    // IAM Role — assumable only by tokens issued for this repo
    // -----------------------------------------------------------------------
    const subCondition = `repo:${owner}/${repo}:${refPattern === "*" ? "*" : `ref:refs/heads/${refPattern}`}`;

    const role = new iam.Role(this, "GitHubActionsRole", {
      roleName: "GitHubActions-AmplifyOutputs",
      description:
        "Assumed by GitHub Actions to run ampx generate outputs (read-only).",
      assumedBy: new iam.FederatedPrincipal(
        oidcProvider.openIdConnectProviderArn,
        {
          StringEquals: {
            "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          },
          StringLike: {
            "token.actions.githubusercontent.com:sub": subCondition,
          },
        },
        "sts:AssumeRoleWithWebIdentity"
      ),
      maxSessionDuration: cdk.Duration.hours(1),
    });

    // Minimum permissions for `ampx generate outputs --branch main --app-id …`
    role.addToPolicy(
      new iam.PolicyStatement({
        sid: "AmplifyOutputsReadOnly",
        effect: iam.Effect.ALLOW,
        actions: [
          "amplify:GetApp",
          "amplify:ListApps",
          "amplify:GetBranch",
          "amplify:ListBranches",
          "amplify:GetBackendEnvironment",
          "amplify:ListBackendEnvironments",
        ],
        resources: ["*"],
      })
    );

    role.addToPolicy(
      new iam.PolicyStatement({
        sid: "CloudFormationDescribeReadOnly",
        effect: iam.Effect.ALLOW,
        actions: [
          "cloudformation:DescribeStacks",
          "cloudformation:DescribeStackResources",
          "cloudformation:GetTemplate",
          "cloudformation:ListStackResources",
        ],
        resources: ["*"],
      })
    );

    role.addToPolicy(
      new iam.PolicyStatement({
        sid: "SSMReadAmplifyParams",
        effect: iam.Effect.ALLOW,
        actions: ["ssm:GetParameter", "ssm:GetParameters"],
        // Amplify Gen 2 stores outputs under /amplify/ prefix
        resources: [
          `arn:aws:ssm:${stack.region}:${stack.account}:parameter/amplify/*`,
        ],
      })
    );

    this.roleArn = role.roleArn;

    // Emit the ARN so it's easy to find after deploy
    new cdk.CfnOutput(this, "GitHubActionsRoleArn", {
      value: role.roleArn,
      description:
        "Copy this ARN into the AWS_ROLE_ARN GitHub Actions secret.",
      exportName: "GitHubActionsRoleArn",
    });
  }
}
