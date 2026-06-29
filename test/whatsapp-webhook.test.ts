import { describe, it, expect } from "vitest"
import { verifyOpenWASignature } from "@/lib/integrations/openwa"
import crypto from "crypto"

describe("WhatsApp Webhook Signature Verification", () => {
  const secret = "whatsapp-webhook-secret-token"
  const rawBody = JSON.stringify({
    event: "message.received",
    session: "31cab49b-845d-4d0b-b1ac-2b84d1755207",
    data: {
      id: "true_12345_out",
      body: "Test message body content",
      from: "5521959307782",
    }
  })

  const expectedHex = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex")
  const validSignatureHeader = `sha256=${expectedHex}`

  it("should verify successfully with a valid signature and body", () => {
    const verified = verifyOpenWASignature(rawBody, validSignatureHeader, secret)
    expect(verified).toBe(true)
  })

  it("should fail validation if signature header is missing", () => {
    const verified = verifyOpenWASignature(rawBody, null, secret)
    expect(verified).toBe(false)
  })

  it("should fail validation if raw body is tampered", () => {
    const tamperedBody = rawBody + "tampered-content"
    const verified = verifyOpenWASignature(tamperedBody, validSignatureHeader, secret)
    expect(verified).toBe(false)
  })

  it("should fail validation if signature is incorrect", () => {
    const invalidSignatureHeader = "sha256=invalid-signature-hex-code"
    const verified = verifyOpenWASignature(rawBody, invalidSignatureHeader, secret)
    expect(verified).toBe(false)
  })

  it("should fail validation if secret key doesn't match", () => {
    const verified = verifyOpenWASignature(rawBody, validSignatureHeader, "wrong-secret-key")
    expect(verified).toBe(false)
  })
})
