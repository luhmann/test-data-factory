import { describe, expect, test } from "vitest";
import { Factory } from "../src/factory";

describe("Example based", () => {
  test("should construct test-data", () => {
    const pirateFactory = Factory.define(() => ({
      firstName: "Jack",
      lastName: "Sparrow",
      occupation: "Pirate",
    }));
  });
});
