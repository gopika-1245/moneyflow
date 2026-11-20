import { describe, it, expect } from "vitest";
import { sanitizeCsvField, formatCurrency } from "@/lib/utils";
import { errorResponse, successResponse } from "@/lib/api-response";

describe("Security - CSV Injection Defense (OWASP)", () => {
  it("escapes leading equals sign", () => {
    expect(sanitizeCsvField("=cmd|' /C calc'!A0")).toBe("''=cmd|' /C calc'!A0'".slice(1, -1)); // starts with '
    expect(sanitizeCsvField("=SUM(A1:B10)")).toBe("'=SUM(A1:B10)");
  });

  it("escapes leading plus sign", () => {
    expect(sanitizeCsvField("+12345")).toBe("'+12345");
  });

  it("escapes leading minus sign", () => {
    expect(sanitizeCsvField("-5000")).toBe("'-5000");
  });

  it("escapes leading at sign and handles comma wrapping", () => {
    expect(sanitizeCsvField("@malicious")).toBe("'@malicious");
    // With comma delimiter, both formula defense quote and CSV double-quote wrapping apply
    expect(sanitizeCsvField("@SUM(1,2)")).toBe('"\'@SUM(1,2)"');
  });

  it("handles null, undefined and non-string inputs safely", () => {
    expect(sanitizeCsvField(null)).toBe("");
    expect(sanitizeCsvField(undefined)).toBe("");
    expect(sanitizeCsvField(12345)).toBe("12345");
  });

  it("wraps and escapes values containing commas or quotes", () => {
    expect(sanitizeCsvField("Groceries, Milk and Bread")).toBe('"Groceries, Milk and Bread"');
    expect(sanitizeCsvField('He said "Hello"')).toBe('"He said ""Hello"""');
  });
});

describe("API Security & Standardization", () => {
  it("formats standardized success responses", async () => {
    const payload = { id: "123", name: "Savings" };
    const res = successResponse(payload, 201);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual(payload);
  });

  it("formats standardized error responses with correct status codes", async () => {
    const res = errorResponse("Unauthorized access attempt", 401, { code: "AUTH_REQUIRED" });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe("Unauthorized access attempt");
    expect(body.details).toEqual({ code: "AUTH_REQUIRED" });
  });

  it("handles 403 Forbidden and 404 Not Found standard formats", async () => {
    const forbidden = errorResponse("Account does not belong to user", 403);
    expect(forbidden.status).toBe(403);

    const notFound = errorResponse("Transaction not found", 404);
    expect(notFound.status).toBe(404);
  });
});

describe("Financial Precision & Currency Formatting", () => {
  it("handles zero and negative amounts in currency formatting", () => {
    const zeroINR = formatCurrency(0, "INR");
    expect(zeroINR).toContain("0.00");

    const negativeINR = formatCurrency(-4500, "INR");
    expect(negativeINR).toContain("4,500.00");
  });

  it("handles non-INR currencies gracefully", () => {
    const usd = formatCurrency(99.99, "USD");
    expect(usd).toContain("99.99");
    expect(usd).toContain("$");

    const eur = formatCurrency(120.5, "EUR");
    expect(eur).toContain("120");
    expect(eur).toContain("50");
    expect(eur).toContain("€");
  });
});
