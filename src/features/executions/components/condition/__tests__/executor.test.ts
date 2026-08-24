import { describe, it, expect, vi, beforeEach } from "vitest";
import { NonRetriableError } from "inngest";
import { ConditionNotMetError } from "@/lib/condition-not-met-error";

vi.mock("@/lib/redis", () => ({
  redis: { get: vi.fn(), set: vi.fn() },
}));
vi.mock("@/inngest/channels/condition", () => ({
  conditionChannel: () => ({ status: (args: unknown) => args }),
}));

const { redis } = await import("@/lib/redis");
const { conditionExecutor } = await import("../executor");

const stubStep = { run: async (_id: string, fn: () => Promise<unknown>) => fn() } as never;
const noopPublish = vi.fn(async () => {});

const baseParams = {
  nodeId: "cond-1",
  userId: "user-1",
  step: stubStep,
  publish: noopPublish,
} as const;

describe("conditionExecutor — validation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws NonRetriableError when leftPath is missing", async () => {
    await expect(
      conditionExecutor({ ...baseParams, data: { operator: ">", rightValue: 1 }, context: {} }),
    ).rejects.toThrow(NonRetriableError);
  });

  it("throws NonRetriableError when operator is missing", async () => {
    await expect(
      conditionExecutor({ ...baseParams, data: { leftPath: "x", rightValue: 1 }, context: {} }),
    ).rejects.toThrow(NonRetriableError);
  });

  it("throws NonRetriableError when neither rightPath nor rightValue is set", async () => {
    await expect(
      conditionExecutor({ ...baseParams, data: { leftPath: "x", operator: ">" }, context: {} }),
    ).rejects.toThrow(NonRetriableError);
  });
});

describe("conditionExecutor — warm-up / insufficient data", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws ConditionNotMetError (not a hard error) when the left value is still null", async () => {
    // Mirrors a real indicator that hasn't seen enough candles yet —
    // fastSma.value is null, not a number.
    await expect(
      conditionExecutor({
        ...baseParams,
        data: { leftPath: "fastSma.value", operator: ">", rightValue: 10 },
        context: { fastSma: { value: null } },
      }),
    ).rejects.toThrow(ConditionNotMetError);
  });
});

describe("conditionExecutor — plain comparisons", () => {
  beforeEach(() => vi.clearAllMocks());

  it("passes through context when the comparison is true", async () => {
    const context = { fastSma: { value: 15 } };
    const result = await conditionExecutor({
      ...baseParams,
      data: { leftPath: "fastSma.value", operator: ">", rightValue: 10 },
      context,
    });
    expect(result).toBe(context);
  });

  it("throws ConditionNotMetError when the comparison is false", async () => {
    await expect(
      conditionExecutor({
        ...baseParams,
        data: { leftPath: "fastSma.value", operator: ">", rightValue: 10 },
        context: { fastSma: { value: 5 } },
      }),
    ).rejects.toThrow(ConditionNotMetError);
  });

  it("supports comparing against another context path, not just a constant", async () => {
    const context = { fastSma: { value: 15 }, slowSma: { value: 10 } };
    const result = await conditionExecutor({
      ...baseParams,
      data: { leftPath: "fastSma.value", operator: ">", rightPath: "slowSma.value" },
      context,
    });
    expect(result).toBe(context);
  });
});

describe("conditionExecutor — crossover detection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does NOT fire on the first tick ever seen, even if currently above (no prior state to compare)", async () => {
    (redis.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null); // no recorded previous state

    await expect(
      conditionExecutor({
        ...baseParams,
        data: { leftPath: "fastSma.value", operator: "crosses_above", rightPath: "slowSma.value" },
        context: { fastSma: { value: 15 }, slowSma: { value: 10 } }, // currently above
      }),
    ).rejects.toThrow(ConditionNotMetError);
  });

  it("fires exactly on the tick the value transitions from below to above", async () => {
    (redis.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false); // was below last tick

    const context = { fastSma: { value: 15 }, slowSma: { value: 10 } }; // now above
    const result = await conditionExecutor({
      ...baseParams,
      data: { leftPath: "fastSma.value", operator: "crosses_above", rightPath: "slowSma.value" },
      context,
    });
    expect(result).toBe(context);
  });

  it("does NOT fire again on a second tick where it's still above (no new transition)", async () => {
    (redis.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(true); // was ALREADY above last tick

    await expect(
      conditionExecutor({
        ...baseParams,
        data: { leftPath: "fastSma.value", operator: "crosses_above", rightPath: "slowSma.value" },
        context: { fastSma: { value: 20 }, slowSma: { value: 10 } }, // still above, not a new crossover
      }),
    ).rejects.toThrow(ConditionNotMetError);
  });

  it("crosses_below fires exactly on the above-to-below transition", async () => {
    (redis.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(true); // was above last tick

    const context = { fastSma: { value: 5 }, slowSma: { value: 10 } }; // now below
    const result = await conditionExecutor({
      ...baseParams,
      data: { leftPath: "fastSma.value", operator: "crosses_below", rightPath: "slowSma.value" },
      context,
    });
    expect(result).toBe(context);
  });

  it("degrades gracefully (treats as first tick) when Redis is unreachable, instead of throwing an unrelated error", async () => {
    (redis.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("network error"));
    (redis.set as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("network error"));

    // Should reject with ConditionNotMetError (treated as "no prior state"),
    // NOT the raw Redis network error leaking out.
    await expect(
      conditionExecutor({
        ...baseParams,
        data: { leftPath: "fastSma.value", operator: "crosses_above", rightPath: "slowSma.value" },
        context: { fastSma: { value: 15 }, slowSma: { value: 10 } },
      }),
    ).rejects.toThrow(ConditionNotMetError);
  });
});