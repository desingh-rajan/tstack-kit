/**
 * Authentication utilities
 * Handles JWT token storage and user session management
 */

import { apiClient } from "./api.ts";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  status: string;
  message: string;
  data: {
    token: string;
    user: {
      id: number;
      email: string;
      role: string;
      username?: string;
    };
  };
}

export interface User {
  id: number;
  email: string;
  role: string;
  name?: string;
}

/**
 * Set authentication token in cookie
 */
export function setAuthToken(token: string): void {
  if (typeof document === "undefined") return;

  // Set cookie with 7 day expiry
  const expires = new Date();
  expires.setDate(expires.getDate() + 7);
  document.cookie =
    `auth_token=${token}; expires=${expires.toUTCString()}; path=/; SameSite=Strict`;
}

/**
 * Get authentication token from cookie
 */
export function getAuthToken(): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(/auth_token=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Remove authentication token
 */
export function clearAuthToken(): void {
  if (typeof document === "undefined") return;

  document.cookie =
    "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

/**
 * Login user
 */
export async function login(
  credentials: LoginCredentials,
): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>(
    "/auth/login",
    credentials,
  );

  if (response.status === "success" && response.data.token) {
    setAuthToken(response.data.token);
  }

  return response;
}

/**
 * Logout user
 */
export function logout(): void {
  clearAuthToken();
  if (typeof globalThis !== "undefined" && "location" in globalThis) {
    (globalThis as typeof globalThis & { location: { href: string } }).location
      .href = "/";
  }
}

/**
 * Decode JWT token (basic decoding without verification)
 * Note: This is client-side only for UI purposes
 */
function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Get current user from token
 */
export function getCurrentUser(): User | null {
  const token = getAuthToken();
  if (!token) return null;

  const decoded = decodeToken(token);
  if (!decoded) return null;

  return {
    id: decoded.userId as number,
    email: decoded.email as string,
    role: decoded.role as string,
    name: decoded.name as string | undefined,
  };
}

/**
 * Check if user has specific role
 */
export function hasRole(role: string): boolean {
  const user = getCurrentUser();
  return user?.role === role;
}

/**
 * Check if user is superadmin
 */
export function isSuperAdmin(): boolean {
  return hasRole("superadmin");
}

/**
 * Check if user is admin or above
 */
export function isAdmin(): boolean {
  const user = getCurrentUser();
  return user?.role === "superadmin" || user?.role === "admin";
}

/**
 * Validate auth token by making a test API call (server-side)
 */
export async function validateAuthToken(token: string): Promise<boolean> {
  try {
    const testClient = new (await import("./api.ts")).ApiClient(
      undefined,
      token,
    );
    // Try to fetch user profile or any authenticated endpoint
    await testClient.get("/auth/me");
    return true;
  } catch {
    return false;
  }
}
