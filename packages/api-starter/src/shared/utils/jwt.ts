import { jwtVerify, SignJWT } from "jose";

/**
 * JWT Configuration
 *
 * JWT_SECRET is required in production. In development/test environments,
 * a default secret is used with a warning logged to the console.
 */
const ENVIRONMENT = Deno.env.get("ENVIRONMENT") || "development";
const jwtSecretEnv = Deno.env.get("JWT_SECRET");

if (!jwtSecretEnv && ENVIRONMENT === "production") {
  throw new Error(
    "FATAL: JWT_SECRET environment variable is required in production. " +
      "Set it to a strong random string (e.g., openssl rand -base64 32).",
  );
}

if (!jwtSecretEnv && ENVIRONMENT !== "test") {
  console.warn(
    "[SECURITY WARNING] JWT_SECRET not set -- using insecure default. " +
      "Set JWT_SECRET in your .env file before deploying.",
  );
}

const JWT_SECRET = jwtSecretEnv || "tstack-dev-secret-do-not-use-in-production";
const JWT_ISSUER = Deno.env.get("JWT_ISSUER") || "tonystack";
const JWT_EXPIRY = Deno.env.get("JWT_EXPIRY") || "1h"; // 1 hour default

const secret = new TextEncoder().encode(JWT_SECRET);

export interface TokenPayload {
  userId: number;
  email: string;
  [key: string]: unknown; // Index signature for jose JWTPayload compatibility
}

/**
 * Create a JWT token
 */
export async function createToken(payload: TokenPayload): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setExpirationTime(JWT_EXPIRY)
    .sign(secret);

  return token;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<TokenPayload> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: JWT_ISSUER,
    });

    return {
      userId: payload.userId as number,
      email: payload.email as string,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Invalid token: ${message}`);
  }
}

/**
 * Extract token from Authorization header
 * Format: "Bearer <token>"
 */
export function extractTokenFromHeader(
  header: string | undefined,
): string | null {
  if (!header) return null;

  const parts = header.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
}
