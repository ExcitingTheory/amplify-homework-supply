/**
 * CloudFormation Custom Resource handler — CloudFront RSA Key Pair Rotation
 *
 * On CREATE / UPDATE:
 *   1. Checks whether the SSM parameters already exist.
 *   2. If they do NOT exist (first deploy), generates a fresh RSA-2048 key pair
 *      using Node's built-in `crypto` module (no native binaries, no extra deps).
 *   3. Writes:
 *        /homework-supply/cloudfront/public-key   (String)
 *        /homework-supply/cloudfront/private-key  (SecureString)
 *      using `Overwrite: false` so a pre-existing key is never silently replaced.
 *   4. On UPDATE, if the caller sets `forceRotate: true` in ResourceProperties,
 *      the parameters ARE overwritten with a freshly generated pair.
 *
 * On DELETE: no-op — SSM parameters are retained for safety.
 *
 * Physical resource ID: /homework-supply/cloudfront/public-key
 */

import {
  SSMClient,
  PutParameterCommand,
  GetParameterCommand,
  ParameterAlreadyExists,
  ParameterNotFound,
} from "@aws-sdk/client-ssm";
import { generateKeyPairSync } from "crypto";

const ssm = new SSMClient({ region: process.env.AWS_REGION ?? "us-east-1" });

const PUBLIC_KEY_PARAM = "/homework-supply/cloudfront/public-key";
const PRIVATE_KEY_PARAM = "/homework-supply/cloudfront/private-key";

async function parameterExists(name: string): Promise<boolean> {
  try {
    await ssm.send(
      new GetParameterCommand({ Name: name, WithDecryption: false }),
    );
    return true;
  } catch (e: any) {
    if (e instanceof ParameterNotFound || e.name === "ParameterNotFound")
      return false;
    throw e;
  }
}

async function writeKeyPair(overwrite: boolean): Promise<void> {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  // CloudFront requires the public key without the -----BEGIN/END----- lines and
  // without newlines for the PublicKey resource, BUT the SSM parameter holds the
  // full PEM so it can be read back and passed verbatim to the CDK construct.
  await ssm.send(
    new PutParameterCommand({
      Name: PUBLIC_KEY_PARAM,
      Value: publicKey,
      Type: "String",
      Overwrite: overwrite,
      Description: "CloudFront RSA public key PEM for signed URL verification",
    }),
  );

  await ssm.send(
    new PutParameterCommand({
      Name: PRIVATE_KEY_PARAM,
      Value: privateKey,
      Type: "SecureString",
      Overwrite: overwrite,
      Description: "CloudFront RSA private key PEM for signed URL generation",
    }),
  );
}

async function getPublicKeyPem(): Promise<string> {
  const resp = await ssm.send(
    new GetParameterCommand({ Name: PUBLIC_KEY_PARAM, WithDecryption: false }),
  );
  return resp.Parameter?.Value ?? "";
}

export const handler = async (event: any): Promise<CrResponse> => {
  console.log(
    "cfKeyRotation event:",
    JSON.stringify({ ...event, ResponseURL: "[redacted]" }),
  );

  const requestType: string = event.RequestType;
  const forceRotate: boolean = event.ResourceProperties?.forceRotate === "true";

  try {
    if (requestType === "Delete") {
      // Retain SSM parameters on stack deletion — never auto-delete key material.
      return success(event, PUBLIC_KEY_PARAM, { Action: "Retained" });
    }

    if (requestType === "Create") {
      // Write only if they don't already exist (safe re-deploy / stack recreation).
      const exists = await parameterExists(PUBLIC_KEY_PARAM);
      if (!exists) {
        await writeKeyPair(false);
        const publicKeyPem = await getPublicKeyPem();
        return success(event, PUBLIC_KEY_PARAM, {
          Action: "Created",
          PublicKeyPem: publicKeyPem,
        });
      }
      const publicKeyPem = await getPublicKeyPem();
      return success(event, PUBLIC_KEY_PARAM, {
        Action: "AlreadyExists",
        PublicKeyPem: publicKeyPem,
      });
    }

    if (requestType === "Update") {
      if (forceRotate) {
        await writeKeyPair(true);
        const publicKeyPem = await getPublicKeyPem();
        return success(event, PUBLIC_KEY_PARAM, {
          Action: "Rotated",
          PublicKeyPem: publicKeyPem,
        });
      }
      // No-op update — key pair is managed separately.
      const publicKeyPem = await getPublicKeyPem();
      return success(event, PUBLIC_KEY_PARAM, {
        Action: "NoOp",
        PublicKeyPem: publicKeyPem,
      });
    }

    return success(event, PUBLIC_KEY_PARAM, { Action: "UnknownRequestType" });
  } catch (err: any) {
    console.error("cfKeyRotation error:", err);
    failure(event, err.message ?? String(err));
  }
};

// ---------------------------------------------------------------------------
// CloudFormation custom resource response helpers
// The cr.Provider framework handles sending the response to CloudFormation.
// We just need to return the appropriate object.
// ---------------------------------------------------------------------------

interface CrResponse {
  PhysicalResourceId: string;
  Data?: Record<string, string>;
}

function success(
  _event: any,
  physicalResourceId: string,
  data?: Record<string, string>,
): CrResponse {
  return {
    PhysicalResourceId: physicalResourceId,
    Data: data ?? {},
  };
}

function failure(_event: any, reason: string): never {
  throw new Error(reason);
}
