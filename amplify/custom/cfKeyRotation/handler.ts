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
    await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: false }));
    return true;
  } catch (e: any) {
    if (e instanceof ParameterNotFound || e.name === "ParameterNotFound") return false;
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
    })
  );

  await ssm.send(
    new PutParameterCommand({
      Name: PRIVATE_KEY_PARAM,
      Value: privateKey,
      Type: "SecureString",
      Overwrite: overwrite,
      Description: "CloudFront RSA private key PEM for signed URL generation",
    })
  );
}

export const handler = async (event: any): Promise<any> => {
  console.log("cfKeyRotation event:", JSON.stringify({ ...event, ResponseURL: "[redacted]" }));

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
        return success(event, PUBLIC_KEY_PARAM, { Action: "Created" });
      }
      return success(event, PUBLIC_KEY_PARAM, { Action: "AlreadyExists" });
    }

    if (requestType === "Update") {
      if (forceRotate) {
        await writeKeyPair(true);
        return success(event, PUBLIC_KEY_PARAM, { Action: "Rotated" });
      }
      // No-op update — key pair is managed separately.
      return success(event, PUBLIC_KEY_PARAM, { Action: "NoOp" });
    }

    return success(event, PUBLIC_KEY_PARAM, { Action: "UnknownRequestType" });
  } catch (err: any) {
    console.error("cfKeyRotation error:", err);
    return failure(event, err.message ?? String(err));
  }
};

// ---------------------------------------------------------------------------
// CloudFormation custom resource response helpers
// ---------------------------------------------------------------------------

function success(event: any, physicalResourceId: string, data?: Record<string, string>) {
  return cfnResponse(event, "SUCCESS", physicalResourceId, data);
}

function failure(event: any, reason: string) {
  return cfnResponse(event, "FAILED", event.PhysicalResourceId ?? "unknown", undefined, reason);
}

async function cfnResponse(
  event: any,
  status: "SUCCESS" | "FAILED",
  physicalResourceId: string,
  data?: Record<string, string>,
  reason?: string,
): Promise<void> {
  const body = JSON.stringify({
    Status: status,
    Reason: reason ?? `See CloudWatch log stream for ${event.LogicalResourceId}`,
    PhysicalResourceId: physicalResourceId,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    Data: data ?? {},
  });

  const url = event.ResponseURL as string;
  await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "" },
    body,
  });
}
