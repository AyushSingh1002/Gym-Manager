import { describe, it, expect } from "vitest"
import { formatDate, formatCurrency, getPlanLabel, getPlanAmount, cn } from "../utils"

describe("formatDate", () => {
  it("formats a date string correctly", () => {
    const result = formatDate(new Date("2024-01-15T00:00:00"))
    expect(result).toContain("Jan")
    expect(result).toContain("2024")
  })

  it("returns empty string for null", () => {
    expect(formatDate(null)).toBe("")
  })

  it("returns empty string for undefined", () => {
    expect(formatDate(undefined)).toBe("")
  })
})

describe("formatCurrency", () => {
  it("formats a number as INR currency", () => {
    const result = formatCurrency(999)
    expect(result).toContain("999")
  })

  it("handles zero", () => {
    const result = formatCurrency(0)
    expect(result).toContain("0")
  })
})

describe("getPlanLabel", () => {
  it("returns correct label for MONTHLY", () => {
    expect(getPlanLabel("MONTHLY")).toBe("Monthly")
  })

  it("returns the key for unknown plans", () => {
    expect(getPlanLabel("UNKNOWN")).toBe("UNKNOWN")
  })
})

describe("getPlanAmount", () => {
  it("returns correct amount for MONTHLY", () => {
    expect(getPlanAmount("MONTHLY")).toBe(999)
  })

  it("returns 0 for unknown plans", () => {
    expect(getPlanAmount("UNKNOWN")).toBe(0)
  })
})

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar")
  })

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible")
  })
})
