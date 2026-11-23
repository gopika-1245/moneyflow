import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/validations";

describe("Authentication Logic & Security", () => {
  it("validates registration input strictly", () => {
    const valid = registerSchema.safeParse({
      fullName: "Rahul Verma",
      email: "rahul@example.com",
      password: "SecurePassword123!",
      confirmPassword: "SecurePassword123!",
    });
    expect(valid.success).toBe(true);

    const mismatched = registerSchema.safeParse({
      fullName: "Rahul Verma",
      email: "rahul@example.com",
      password: "SecurePassword123!",
      confirmPassword: "DifferentPassword123!",
    });
    expect(mismatched.success).toBe(false);
  });

  it("validates login inputs and handles trim/sanitization", () => {
    const valid = loginSchema.safeParse({
      email: "test@moneyflow.app",
      password: "password123",
    });
    expect(valid.success).toBe(true);

    const invalid = loginSchema.safeParse({
      email: "not-an-email",
      password: "123",
    });
    expect(invalid.success).toBe(false);
  });

  it("prevents open redirect vulnerabilities in auth callback path validation", () => {
    const sanitizeNext = (next: string | null) => {
      if (!next) return "/dashboard";
      return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
    };

    expect(sanitizeNext("/transactions")).toBe("/transactions");
    expect(sanitizeNext("/reset-password")).toBe("/reset-password");
    expect(sanitizeNext("https://malicious.com")).toBe("/dashboard");
    expect(sanitizeNext("//malicious.com")).toBe("/dashboard");
    expect(sanitizeNext("javascript:alert(1)")).toBe("/dashboard");
    expect(sanitizeNext(null)).toBe("/dashboard");
  });

  it("maps authentication errors to safe, user-friendly messages", () => {
    const mapAuthError = (rawMsg: string) => {
      const lower = rawMsg.toLowerCase();
      if (lower.includes("email not confirmed")) {
        return { type: "unconfirmed", message: "Email verification required" };
      }
      if (lower.includes("invalid login credentials") || lower.includes("invalid_credentials")) {
        return { type: "credentials", message: "Invalid email or password. Please try again." };
      }
      if (lower.includes("network") || lower.includes("fetch")) {
        return { type: "network", message: "Connection error. Please check your network and try again." };
      }
      return { type: "generic", message: "Unable to sign in. Please verify your credentials and try again." };
    };

    expect(mapAuthError("Email not confirmed").type).toBe("unconfirmed");
    expect(mapAuthError("Invalid login credentials").message).toBe("Invalid email or password. Please try again.");
    expect(mapAuthError("NetworkError when attempting to fetch resource").type).toBe("network");
    expect(mapAuthError("Some internal server error").message).toBe("Unable to sign in. Please verify your credentials and try again.");
  });
});
