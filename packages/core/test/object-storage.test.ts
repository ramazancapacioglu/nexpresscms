import assert from "node:assert/strict";
import test from "node:test";
import { resolveObjectStorageConfig, signObjectRequest } from "../src/object-storage";

const secret = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";
const keyId = "AKIAIOSFODNN7EXAMPLE";

test("yapılandırma: eksik ve http kapalı; https ve yerel izin açık", () => {
  assert.equal(resolveObjectStorageConfig({}), null);
  assert.equal(resolveObjectStorageConfig({ S3_ENDPOINT: "http://s3.ornek.test", S3_BUCKET: "kova", S3_ACCESS_KEY_ID: "a", S3_SECRET_ACCESS_KEY: "b" }), null);
  assert.equal(resolveObjectStorageConfig({ S3_ENDPOINT: "http://127.0.0.1:9000", S3_BUCKET: "kova", S3_ACCESS_KEY_ID: "a", S3_SECRET_ACCESS_KEY: "b" }), null);
  const local = resolveObjectStorageConfig({ S3_ENDPOINT: "http://127.0.0.1:9000", S3_BUCKET: "kova", S3_ACCESS_KEY_ID: "a", S3_SECRET_ACCESS_KEY: "b", S3_ALLOW_PRIVATE: "1" });
  assert.equal(local?.endpoint, "http://127.0.0.1:9000");
  assert.equal(local?.forcePathStyle, true);
  const aws = resolveObjectStorageConfig({ S3_ENDPOINT: "https://s3.us-east-1.amazonaws.com", S3_BUCKET: "kova", S3_ACCESS_KEY_ID: "a", S3_SECRET_ACCESS_KEY: "b", S3_REGION: "us-east-1" });
  assert.equal(aws?.forcePathStyle, false);
  assert.equal(resolveObjectStorageConfig({ S3_ENDPOINT: "https://s3.ornek.test", S3_BUCKET: "..", S3_ACCESS_KEY_ID: "a", S3_SECRET_ACCESS_KEY: "b" }), null);
});

test("SigV4: AWS GET örneği (sanal barındırma)", () => {
  const cfg = {
    endpoint: "https://s3.amazonaws.com",
    region: "us-east-1",
    bucket: "examplebucket",
    accessKeyId: keyId,
    secretAccessKey: secret,
    forcePathStyle: false,
  };
  const signed = signObjectRequest(cfg, {
    method: "GET",
    key: "test.txt",
    now: new Date("2013-05-24T00:00:00.000Z"),
    extraHeaders: { range: "bytes=0-9" },
  });
  assert.equal(signed.url, "https://examplebucket.s3.amazonaws.com/test.txt");
  assert.equal(signed.headers["x-amz-date"], "20130524T000000Z");
  assert.match(signed.headers.Authorization, /Signature=f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41$/);
});

test("yol biçimi: anahtar kovadan sonra, sır başlığa yazılır", () => {
  const cfg = resolveObjectStorageConfig({
    S3_ENDPOINT: "https://hesap.r2.cloudflarestorage.com",
    S3_BUCKET: "medya",
    S3_ACCESS_KEY_ID: keyId,
    S3_SECRET_ACCESS_KEY: secret,
    S3_REGION: "auto",
  })!;
  const signed = signObjectRequest(cfg, { method: "PUT", key: "default/med_1/original", body: Buffer.from("abc"), now: new Date("2026-11-14T00:00:00.000Z") });
  assert.equal(signed.url, "https://hesap.r2.cloudflarestorage.com/medya/default/med_1/original");
  assert.match(signed.headers.Authorization, /^AWS4-HMAC-SHA256 /);
  assert.equal(JSON.stringify(signed).includes(secret), false);
});
