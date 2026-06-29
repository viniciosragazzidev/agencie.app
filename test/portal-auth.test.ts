import { describe, it, expect, vi, beforeEach } from "vitest"
import { signPortalToken, verifyPortalToken, setPortalCookie, clearPortalCookie, authorizePortalClient } from "@/lib/portal-auth"
import { cookies } from "next/headers"
import { db } from "@/lib/db"

// Mock next/headers
vi.mock("next/headers", () => {
  const mockCookieStore = {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }
  return {
    cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
    headers: vi.fn(),
  }
})

// Mock lib/db
vi.mock("@/lib/db", () => {
  const mockDb = {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        innerJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([{ id: "client-123", userId: "agency-456", portalEnabled: true }]))
          }))
        }))
      }))
    })),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }
  return { db: mockDb }
})

describe("Portal Authentication System", () => {
  const clientId = "client-123"
  const agencyId = "agency-456"

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.PORTAL_JWT_SECRET = "test-secret-key-12345"
  })

  describe("signPortalToken & verifyPortalToken", () => {
    it("should sign and verify a portal token correctly", async () => {
      const token = await signPortalToken(clientId, agencyId)
      expect(token).toBeDefined()
      expect(typeof token).toBe("string")

      const payload = await verifyPortalToken(token)
      expect(payload).not.toBeNull()
      expect(payload?.clientId).toBe(clientId)
      expect(payload?.agencyId).toBe(agencyId)
    })

    it("should fail validation for expired or tampered tokens", async () => {
      const token = await signPortalToken(clientId, agencyId)
      const parts = token.split(".")
      const tamperedToken = `${parts[0]}.${parts[1]}.fake-signature`

      const payload = await verifyPortalToken(tamperedToken)
      expect(payload).toBeNull()
    })
  })

  describe("Cookie operations", () => {
    it("should set portal token cookie", async () => {
      const token = "some-jwt-token"
      await setPortalCookie(token)

      const cookieStore = await cookies()
      expect(cookieStore.set).toHaveBeenCalledWith("portal_token", token, expect.any(Object))
    })

    it("should clear portal token cookie", async () => {
      await clearPortalCookie()

      const cookieStore = await cookies()
      expect(cookieStore.delete).toHaveBeenCalledWith("portal_token")
    })
  })

  describe("authorizePortalClient", () => {
    it("should authorize a client when a valid portal token matches the clientId", async () => {
      const token = await signPortalToken(clientId, agencyId)
      
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: token }),
        set: vi.fn(),
        delete: vi.fn(),
      }
      vi.mocked(cookies).mockImplementation(async () => mockCookieStore as any)

      const result = await authorizePortalClient(clientId)
      expect(result).toBe(clientId)
    })

    it("should reject authorization if the token clientId does not match the requested clientId", async () => {
      const token = await signPortalToken("another-client", agencyId)
      
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: token }),
        set: vi.fn(),
        delete: vi.fn(),
      }
      vi.mocked(cookies).mockImplementation(async () => mockCookieStore as any)

      // Stub authorizePortalClient inner logic checks
      const result = await authorizePortalClient(clientId)
      expect(result).toBeNull()
    })
  })
})
