/**
 * MediaCDN CDK Construct
 *
 * Creates a CloudFront distribution in front of the Amplify S3 bucket using
 * Origin Access Control (OAC). Replaces direct presigned S3 URLs with stable
 * CDN URLs for all public content, and signed CDN URLs for protected/private.
 *
 * Cache behaviors:
 *  - public/*          → 1 year (immutable, no auth)
 *  - protected/*       → 24 h edge cache, signed URL required
 *  - private/*         → no edge cache, signed URL required
 *
 * Setup:
 *  1. Generate an RSA-2048 key pair:
 *       openssl genrsa -out cf-private.pem 2048
 *       openssl rsa -pubout -in cf-private.pem -out cf-public.pem
 *  2. Store the public key PEM in SSM (plain string):
 *       aws ssm put-parameter --name /homework-supply/cloudfront/public-key \
 *         --value "$(cat cf-public.pem)" --type String
 *  3. Store the private key PEM in SSM (SecureString):
 *       aws ssm put-parameter --name /homework-supply/cloudfront/private-key \
 *         --value "$(cat cf-private.pem)" --type SecureString
 *  4. The CDK construct reads the public key from SSM at deploy time and
 *     outputs the CloudFront key pair ID to SSM for Lambda use.
 *
 * The STORAGE_BUCKET and CF_KEY_PAIR_ID env vars are set on the sectionHandler
 * Lambda in backend.ts so it can generate signed URLs.
 */

import { Construct } from "constructs";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import { Stack, Duration } from "aws-cdk-lib";

export interface MediaCDNConstructProps {
  /** The Amplify storage S3 bucket */
  bucket: s3.IBucket;
  /**
   * SSM parameter name containing the CloudFront RSA public key PEM.
   * If omitted, signed URL support is disabled and all behaviours are public.
   * Default: /homework-supply/cloudfront/public-key
   */
  cfPublicKeyParamName?: string;
}

export class MediaCDNConstruct extends Construct {
  /** The CloudFront distribution */
  public readonly distribution: cloudfront.Distribution;

  /**
   * The CloudFront key pair ID needed by Lambdas that generate signed URLs.
   * Undefined when cfPublicKeyParamName is not provided.
   */
  public readonly keyPairId: string | undefined;

  constructor(scope: Construct, id: string, props: MediaCDNConstructProps) {
    super(scope, id);

    const {
      bucket,
      cfPublicKeyParamName = "/homework-supply/cloudfront/public-key",
    } = props;

    // -------------------------------------------------------------------------
    // CloudFront key pair for signed URLs (read public key PEM from SSM)
    // -------------------------------------------------------------------------
    let trustedKeyGroups: cloudfront.IKeyGroup[] | undefined;
    let cfPublicKey: cloudfront.PublicKey | undefined;

    const publicKeyPem = ssm.StringParameter.valueForStringParameter(
      this,
      cfPublicKeyParamName,
    );

    cfPublicKey = new cloudfront.PublicKey(this, "SigningPublicKey", {
      encodedKey: publicKeyPem,
    });

    const keyGroup = new cloudfront.KeyGroup(this, "SigningKeyGroup", {
      items: [cfPublicKey],
    });

    trustedKeyGroups = [keyGroup];
    this.keyPairId = cfPublicKey.publicKeyId;

    // Write key pair ID to SSM so Lambdas can read it at runtime
    new ssm.StringParameter(this, "CfKeyPairIdParam", {
      parameterName: "/homework-supply/cloudfront/key-pair-id",
      stringValue: cfPublicKey.publicKeyId,
      description: "CloudFront key pair ID for signed URL generation",
    });

    // -------------------------------------------------------------------------
    // S3 origin with Origin Access Control (OAC)
    // -------------------------------------------------------------------------
    const s3Origin = origins.S3BucketOrigin.withOriginAccessControl(bucket);

    // -------------------------------------------------------------------------
    // Cache policies
    // -------------------------------------------------------------------------
    const immutablePolicy = new cloudfront.CachePolicy(
      this,
      "ImmutableCachePolicy",
      {
        comment: "1-year cache for immutable public assets",
        defaultTtl: Duration.days(365),
        maxTtl: Duration.days(365),
        minTtl: Duration.days(365),
        enableAcceptEncodingBrotli: true,
        enableAcceptEncodingGzip: true,
      },
    );

    const mediaCachePolicy = new cloudfront.CachePolicy(
      this,
      "MediaCachePolicy",
      {
        comment: "24-hour cache for protected media (images, audio, video segments)",
        defaultTtl: Duration.hours(24),
        maxTtl: Duration.days(7),
        minTtl: Duration.seconds(0),
        enableAcceptEncodingBrotli: true,
        enableAcceptEncodingGzip: true,
      },
    );

    // -------------------------------------------------------------------------
    // CloudFront distribution
    // -------------------------------------------------------------------------
    this.distribution = new cloudfront.Distribution(this, "Distribution", {
      comment: "Homework Supply media CDN",

      // Default: catch-all for protected/ content (images, audio, video)
      defaultBehavior: {
        origin: s3Origin,
        viewerProtocolPolicy:
          cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: mediaCachePolicy,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        trustedKeyGroups,
      },

      additionalBehaviors: {
        // public/* — immutable, no signing required
        "public/*": {
          origin: s3Origin,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: immutablePolicy,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
          // No trustedKeyGroups — public content is open
        },

        // private/* — no edge caching, signed URL required
        "private/*": {
          origin: s3Origin,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
          trustedKeyGroups,
        },

        // HLS manifests — no caching (manifests change on re-transcode)
        "protected/*/hlsOutput/*.m3u8": {
          origin: s3Origin,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
          trustedKeyGroups,
        },
      },
    });

    // -------------------------------------------------------------------------
    // Bucket policy: allow CloudFront OAC to read from S3
    // -------------------------------------------------------------------------
    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: "AllowCloudFrontServicePrincipal",
        actions: ["s3:GetObject"],
        principals: [new iam.ServicePrincipal("cloudfront.amazonaws.com")],
        resources: [bucket.arnForObjects("*")],
        conditions: {
          StringEquals: {
            "AWS:SourceArn": `arn:aws:cloudfront::${Stack.of(this).account}:distribution/${this.distribution.distributionId}`,
          },
        },
      }),
    );
  }
}
