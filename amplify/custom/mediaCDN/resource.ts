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
import { Duration } from "aws-cdk-lib";

export interface MediaCDNConstructProps {
  /** The Amplify storage S3 bucket */
  bucket: s3.IBucket;
  /**
   * The CloudFront RSA public key PEM (as a CDK token or literal string).
   * Passed from the CfKeyRotation custom resource output to avoid SSM dynamic
   * references that fail on first deploy.
   */
  cfPublicKeyPem: string;
}

export class MediaCDNConstruct extends Construct {
  /** The CloudFront distribution */
  public readonly distribution: cloudfront.Distribution;

  /**
   * The CloudFront key pair ID needed by Lambdas that generate signed URLs.
   */
  public readonly keyPairId: string;

  constructor(scope: Construct, id: string, props: MediaCDNConstructProps) {
    super(scope, id);

    const { bucket, cfPublicKeyPem } = props;

    // -------------------------------------------------------------------------
    // CloudFront key pair for signed URLs
    // -------------------------------------------------------------------------
    let trustedKeyGroups: cloudfront.IKeyGroup[] | undefined;

    const cfPublicKey = new cloudfront.PublicKey(this, "SigningPublicKey", {
      encodedKey: cfPublicKeyPem,
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
    // S3 origin — we intentionally do NOT use withOriginAccessControl() here
    // because it auto-adds a bucket policy statement referencing the
    // distribution ARN, which creates a cross-stack circular dependency when
    // the distribution and bucket are in different nested stacks.
    // Instead we attach OAC at the L1 (CfnDistribution) level after creation,
    // and the bucket policy is managed in backend.ts without the distribution
    // ARN condition.
    // -------------------------------------------------------------------------
    const s3Origin = origins.S3BucketOrigin.withBucketDefaults(bucket);

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
        comment:
          "24-hour cache for protected media (images, audio, video segments)",
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
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
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

        // Phase 6 — Published unit content + ngrams index
        // Served via CloudFront signed cookie issued by getUnitsCdnCookie at app load.
        // TTL: 1 hour (covers unit JSON, audio, images, and ngrams/v1.json equally).
        // NOTE: This behavior must be listed BEFORE the protected/* default behavior
        // so CloudFront matches it first for the more-specific path prefix.
        "protected/units/*": {
          origin: s3Origin,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: new cloudfront.CachePolicy(
            this,
            "UnitContentCachePolicy",
            {
              comment: "1-hour cache for published unit content and ngrams",
              defaultTtl: Duration.hours(1),
              maxTtl: Duration.hours(4),
              minTtl: Duration.seconds(0),
              enableAcceptEncodingBrotli: true,
              enableAcceptEncodingGzip: true,
            },
          ),
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
          trustedKeyGroups,
        },
      },
    });

    // -------------------------------------------------------------------------
    // Attach OAC at L1 level — override the CfnDistribution to use OAC
    // instead of OAI. This avoids the automatic bucket policy that the L2
    // withOriginAccessControl() would add (which causes circular dependency).
    // -------------------------------------------------------------------------
    const cfnOac = new cloudfront.CfnOriginAccessControl(this, "OAC", {
      originAccessControlConfig: {
        name: "homework-supply-media-oac",
        originAccessControlOriginType: "s3",
        signingBehavior: "always",
        signingProtocol: "sigv4",
        description: "OAC for Homework Supply media CDN",
      },
    });

    const cfnDistribution = this.distribution.node
      .defaultChild as cloudfront.CfnDistribution;
    // Set OAC on the first origin and remove any OAI reference
    cfnDistribution.addPropertyOverride(
      "DistributionConfig.Origins.0.OriginAccessControlId",
      cfnOac.attrId,
    );
    cfnDistribution.addPropertyOverride(
      "DistributionConfig.Origins.0.S3OriginConfig.OriginAccessIdentity",
      "",
    );

    // -------------------------------------------------------------------------
    // Bucket policy: CloudFront OAC access to S3
    // NOTE: We do NOT manually call bucket.addToResourcePolicy here because
    // that would create a cross-stack dependency (storage stack referencing
    // distribution ID from data stack) which causes a CloudFormation circular
    // dependency error. The bucket policy is managed in backend.ts.
    // -------------------------------------------------------------------------
  }
}
