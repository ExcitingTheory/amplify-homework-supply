import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { once } from "node:events";

const image = process.env.NATIVE_VOCABULARY_IMAGE ?? "homework-native-vocabulary:local";
const name = `native-vocabulary-runtime-${process.pid}`;
let invocationSent = false;
let resolveResult;
let rejectResult;
const result = new Promise((resolve, reject) => {
  resolveResult = resolve;
  rejectResult = reject;
});
const server = createServer(async (request, response) => {
  if (request.url === "/2018-06-01/runtime/invocation/next") {
    if (invocationSent) return;
    invocationSent = true;
    response.writeHead(200, {
      "Content-Type": "application/json",
      "Lambda-Runtime-Aws-Request-Id": "runtime-smoke",
      "Lambda-Runtime-Deadline-Ms": String(Date.now() + 30_000),
      "Lambda-Runtime-Invoked-Function-Arn": "arn:aws:lambda:us-east-1:123456789012:function:runtime-smoke",
    });
    response.end(JSON.stringify({ manifestKey: "invalid" }));
    return;
  }
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const body = Buffer.concat(chunks).toString();
  response.writeHead(202);
  response.end();
  if (request.url === "/2018-06-01/runtime/invocation/runtime-smoke/error") {
    resolveResult(body);
  } else {
    rejectResult(new Error(`Unexpected runtime request ${request.url}: ${body}`));
  }
});

server.listen(0, "0.0.0.0");
await once(server, "listening");
const address = server.address();
assert(address && typeof address !== "string");
const child = spawn("docker", [
  "run", "--rm", "--name", name,
  "--user", "1000:1000", "--read-only", "--tmpfs", "/tmp:rw,size=64m",
  "--add-host", "host.docker.internal:host-gateway",
  "-e", `AWS_LAMBDA_RUNTIME_API=host.docker.internal:${address.port}`,
  "-e", "AWS_REGION=us-east-1",
  "-e", "AWS_LAMBDA_FUNCTION_NAME=runtime-smoke",
  "-e", "AWS_LAMBDA_FUNCTION_VERSION=$LATEST",
  "-e", "AWS_LAMBDA_FUNCTION_MEMORY_SIZE=3072",
  "-e", "AWS_LAMBDA_LOG_GROUP_NAME=/aws/lambda/runtime-smoke",
  "-e", "AWS_LAMBDA_LOG_STREAM_NAME=runtime-smoke",
  "-e", "_HANDLER=handler.handler",
  "-e", "STORAGE_BUCKET=runtime-smoke",
  image,
], { stdio: ["ignore", "pipe", "pipe"] });
let logs = "";
child.stdout.on("data", (chunk) => { logs += chunk; });
child.stderr.on("data", (chunk) => { logs += chunk; });
child.on("error", rejectResult);
child.on("close", (code) => rejectResult(new Error(`Container exited ${code}: ${logs}`)));
const timer = setTimeout(() => rejectResult(new Error(`Runtime invocation timed out: ${logs}`)), 60_000);
let runtimeError;
try {
  const error = JSON.parse(await result);
  assert.equal(error.errorMessage, "Invalid native vocabulary artifact key");
  console.log("Lambda runtime dispatched the invocation and reported the handler's validation error.");
} catch (error) {
  runtimeError = error;
  throw error;
} finally {
  clearTimeout(timer);
  const stopped = child.pid && child.exitCode === null && child.signalCode === null
    ? spawnSync("docker", ["stop", "--time", "2", name], { encoding: "utf8" })
    : undefined;
  server.closeAllConnections();
  server.close();
  const cleanupError = stopped?.error ?? (stopped && stopped.status !== 0
    ? new Error(`Could not stop smoke container: ${stopped.stderr}`)
    : undefined);
  if (cleanupError) {
    if (runtimeError) throw new AggregateError([runtimeError, cleanupError], "Runtime smoke test and container cleanup failed");
    throw cleanupError;
  }
}
