import { describe, expect, it } from "vitest";
import { estimateTripFare } from "@/lib/trip-pricing";

describe("surge pricing base", () => {
  it("calcula tarifa minima en RD para auto", () => {
    const fare = estimateTripFare(5, 15, "CAR", "PULSAR");
    expect(fare).toBeGreaterThan(100);
  });

  it("tier BLACK es mas caro que PULSAR", () => {
    const pulsar = estimateTripFare(8, 20, "CAR", "PULSAR");
    const black = estimateTripFare(8, 20, "CAR", "BLACK");
    expect(black).toBeGreaterThan(pulsar);
  });
});
