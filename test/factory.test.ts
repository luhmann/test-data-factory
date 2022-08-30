import { describe, expect, test } from "@jest/globals";
import * as fc from "fast-check";
import { Factory } from "../src/factory";

type Ship = {
  name: string;
  cannons: number;
  crew: number;
  harbor: string;
};

type Pirate = {
  firstName: string;
  lastName: string;
  occupation: "Pirate" | "Captain";
  ship?: Ship;
  skills?: string[];
  bounty?: number;
};

describe("Example based", () => {
  test("should build simple data", () => {
    const pirateFactory = Factory.define<Pirate>(() => ({
      firstName: "Jack",
      lastName: "Sparrow",
      occupation: "Pirate",
    }));

    const output = pirateFactory.build();

    expect(output).toMatchInlineSnapshot(`
      {
        "firstName": "Jack",
        "lastName": "Sparrow",
        "occupation": "Pirate",
      }
    `);
  });

  test("should allow override", () => {
    const pirateFactory = Factory.define<Pirate>(() => ({
      firstName: "Jack",
      lastName: "Sparrow",
      occupation: "Pirate",
    }));

    const output = pirateFactory.build({
      lastName: "Jones",
      occupation: "Captain",
    });

    expect(output).toMatchInlineSnapshot(`
      {
        "firstName": "Jack",
        "lastName": "Jones",
        "occupation": "Captain",
      }
    `);
  });

  test("should build nested data", () => {
    const pirateFactory = Factory.define<Pirate>(() => ({
      firstName: "Jack",
      lastName: "Sparrow",
      occupation: "Pirate",
      ship: {
        name: "Black Pearl",
        cannons: 120,
        crew: 250,
        harbor: "Sansibar",
      },
    }));

    const output = pirateFactory.build();

    expect(output).toMatchInlineSnapshot(`
      {
        "firstName": "Jack",
        "lastName": "Sparrow",
        "occupation": "Pirate",
        "ship": {
          "cannons": 120,
          "crew": 250,
          "harbor": "Sansibar",
          "name": "Black Pearl",
        },
      }
    `);
  });

  test("should allow nested override", () => {
    const pirateFactory = Factory.define<Pirate>(() => ({
      firstName: "Jack",
      lastName: "Sparrow",
      occupation: "Pirate",
      ship: {
        name: "Black Pearl",
        cannons: 120,
        crew: 250,
        harbor: "Sansibar",
      },
    }));

    const output = pirateFactory.build({
      occupation: "Captain",
      ship: {
        cannons: 1000,
      },
    });

    expect(output).toMatchInlineSnapshot(`
      {
        "firstName": "Jack",
        "lastName": "Sparrow",
        "occupation": "Captain",
        "ship": {
          "cannons": 1000,
          "crew": 250,
          "harbor": "Sansibar",
          "name": "Black Pearl",
        },
      }
    `);
  });

  test("should replace array", () => {
    const pirateFactory = Factory.define<Pirate>(() => ({
      firstName: "Jack",
      lastName: "Sparrow",
      occupation: "Pirate",
      skills: ["Racketeering", "Heists"],
    }));

    const output = pirateFactory.build({
      skills: ["Sailing"],
    });

    expect(output).toMatchInlineSnapshot(`
      {
        "firstName": "Jack",
        "lastName": "Sparrow",
        "occupation": "Pirate",
        "skills": [
          "Sailing",
        ],
      }
    `);
  });

  test("Should allow overrides with `params`", () => {
    const pirateFactory = Factory.define<Pirate>(() => ({
      firstName: "Jack",
      lastName: "Sparrow",
      occupation: "Pirate",
      skills: ["Racketeering", "Heists"],
    }));
    const captainFactory = pirateFactory.params({ occupation: "Captain" });

    const output = captainFactory.build({ firstName: "John" });

    expect(output).toMatchInlineSnapshot(`
      {
        "firstName": "John",
        "lastName": "Sparrow",
        "occupation": "Captain",
        "skills": [
          "Racketeering",
          "Heists",
        ],
      }
    `);
  });

  test("passes transient params without adding them to output", () => {
    const pirateFactory = Factory.define<Pirate>(({ transientParams }) => ({
      firstName: "Jack",
      lastName: "Sparrow",
      occupation: "Pirate",
      skills: ["Racketeering", "Heists"],
      bounty: transientParams.isWanted ? 50_000 : 0,
    }));

    const noBounty = pirateFactory.build();
    expect(noBounty.bounty).toEqual(0);
    //@ts-ignore
    expect(noBounty.isWanted).toEqual(undefined);

    const withBounty = pirateFactory.build(undefined, {
      transient: { isWanted: true },
    });
    expect(withBounty.bounty).toEqual(50_000);
    //@ts-ignore
    expect(withBounty.isWanted).toEqual(undefined);
  });

  describe("`sequence`", () => {
    test("passes sequence and increments it per invocation", () => {
      const pirateFactory = Factory.define<Pirate>(({ sequence }) => ({
        firstName: `Jack - ${sequence}`,
        lastName: "Sparrow",
        occupation: "Pirate",
      }));

      const one = pirateFactory.build();
      const two = pirateFactory.build();

      expect(one.firstName).toEqual("Jack - 1");
      expect(two.firstName).toEqual("Jack - 2");
    });

    test("sequence can be rewound", () => {
      const pirateFactory = Factory.define<Pirate>(({ sequence }) => ({
        firstName: `Jack - ${sequence}`,
        lastName: "Sparrow",
        occupation: "Pirate",
      }));

      const one = pirateFactory.build();
      pirateFactory.rewindSequence();
      const two = pirateFactory.build();

      expect(one.firstName).toEqual("Jack - 1");
      expect(two.firstName).toEqual("Jack - 1");
    });
  });

  test("passing `undefined`, returns original value", () => {
    const pirateFactory = Factory.define<Pirate>(() => ({
      firstName: "Jack",
      lastName: "Sparrow",
      occupation: "Pirate",
      skills: ["Racketeering", "Heists"],
    }));

    const output = pirateFactory.build({
      firstName: undefined,
    });

    expect(output).toMatchInlineSnapshot(`
      {
        "firstName": "Jack",
        "lastName": "Sparrow",
        "occupation": "Pirate",
        "skills": [
          "Racketeering",
          "Heists",
        ],
      }
    `);
  });

  test("can build a list", () => {
    const pirateFactory = Factory.define<Pirate>(({ sequence }) => ({
      firstName: `Jack - ${sequence}`,
      lastName: "Sparrow",
      occupation: "Pirate",
    }));

    const output = pirateFactory.buildList(2);

    expect(output).toMatchInlineSnapshot(`
      [
        {
          "firstName": "Jack - 1",
          "lastName": "Sparrow",
          "occupation": "Pirate",
        },
        {
          "firstName": "Jack - 2",
          "lastName": "Sparrow",
          "occupation": "Pirate",
        },
      ]
    `);
  });
});

describe("Property based", () => {
  const genPirate = () =>
    fc.record({
      firstName: fc.string(),
      lastName: fc.string(),
      occupation: fc.oneof(fc.constant("Pirate"), fc.constant("Captain")),
      ship: fc.record({
        name: fc.string(),
        cannons: fc.nat(),
        crew: fc.nat(),
        harbor: fc.string(),
      }),
      skills: fc.array(fc.string()),
    });

  const genOverride = () =>
    fc.record({
      lastName: fc.string(),
      ship: fc.record({
        cannons: fc.nat(),
      }),
    });

  test("should return the object returned in the factory method", () => {
    fc.assert(
      fc.property(genPirate(), (obj) => {
        const factory = Factory.define(() => obj);

        const output = factory.build();

        expect(output).toEqual(obj);
      })
    );
  });

  test("should apply overrides", () => {
    fc.assert(
      fc.property(genPirate(), genOverride(), (obj, override) => {
        const factory = Factory.define(() => obj);

        const output = factory.build(override);

        expect(output.lastName).toEqual(override.lastName);
        expect(output.ship.cannons).toEqual(override.ship.cannons);
      })
    );
  });

  test("should allow derived factories", () => {
    fc.assert(
      fc.property(genPirate(), genOverride(), (pirate, override) => {
        const factory = Factory.define(() => pirate);
        const derivedFactory = factory.params(override);

        const output = derivedFactory.build({ firstName: "constant" });

        expect(output.firstName).toEqual("constant");
        expect(output.lastName).toEqual(override.lastName);
        expect(output.ship.cannons).toEqual(override.ship.cannons);
      })
    );
  });

  test("should pass transient params", () => {
    fc.assert(
      fc.property(genPirate(), fc.boolean(), (pirate, isWanted) => {
        const factory = Factory.define(({ transientParams }) => {
          return {
            ...pirate,
            bounty: transientParams.isWanted ? 10000 : 0,
          };
        });

        const output = factory.build(undefined, { transient: { isWanted } });

        expect(output).toEqual({ ...pirate, bounty: isWanted ? 10000 : 0 });
      })
    );
  });

  test("when an array is passed as override, then it is replaced instead of merged", () => {
    fc.assert(
      fc.property(genPirate(), (pirate) => {
        const factory = Factory.define(() => pirate);

        const output = factory.build({
          skills: ["None"],
        });
        expect(output).toStrictEqual({ ...pirate, skills: ["None"] });
      })
    );
  });

  test("should allow override", () => {
    fc.assert(
      fc.property(
        fc.object({
          withSet: true,
          withBigInt: true,
          withDate: true,
          withMap: true,
          withBoxedValues: true,
        }),
        fc.string(),
        (data, override) => {
          const factory = Factory.define(() => data);

          const overrideProp = Object.keys(data)[0];
          const output = factory.build({ [overrideProp]: override });

          expect(output).toEqual({ ...data, [overrideProp]: override });
        }
      )
    );
  });
});
