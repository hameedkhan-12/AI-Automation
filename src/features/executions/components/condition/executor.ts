import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/executions/types";
import { conditionChannel } from "@/inngest/channels/condition";
import { redis } from "@/lib/redis";
import { ConditionNotMetError } from "@/lib/condition-not-met-error";

type ComparisonOperator = ">" | "<" | ">=" | "<=" | "==" | "!=" | "crosses_above" | "crosses_below";

type ConditionData = {
  leftPath?: string;  
  operator?: ComparisonOperator;
  rightPath?: string; 
  rightValue?: number; 
};

function readPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function getRedisKey(nodeId: string) {
  return `condition:${nodeId}:prevResult`;
}

export const conditionExecutor: NodeExecutor<ConditionData> = async ({
  data,
  nodeId,
  context,
  publish,
}) => {
  await publish(conditionChannel().status({ nodeId, status: "loading" }));

  if (!data.leftPath) {
    await publish(conditionChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Condition: leftPath is required");
  }
  if (!data.operator) {
    await publish(conditionChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Condition: operator is required");
  }
  if (!data.rightPath && data.rightValue === undefined) {
    await publish(conditionChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Condition: rightPath or rightValue is required");
  }

  const leftRaw = readPath(context, data.leftPath);
  const rightRaw = data.rightPath ? readPath(context, data.rightPath) : data.rightValue;

  const left = typeof leftRaw === "number" ? leftRaw : Number(leftRaw);
  const right = typeof rightRaw === "number" ? rightRaw : Number(rightRaw);

  // Insufficient data upstream (e.g. indicator hasn't seen enough candles)
  if (Number.isNaN(left) || Number.isNaN(right)) {
    await publish(conditionChannel().status({ nodeId, status: "skipped" }));
    throw new ConditionNotMetError(
      `Condition: cannot evaluate — "${data.leftPath}" or right-hand value is not a number yet (still warming up)`,
    );
  }

  const simpleResult = (() => {
    switch (data.operator) {
      case ">": return left > right;
      case "<": return left < right;
      case ">=": return left >= right;
      case "<=": return left <= right;
      case "==": return left === right;
      case "!=": return left !== right;
      case "crosses_above": return left > right;
      case "crosses_below": return left < right;
      default: return false;
    }
  })();

  let result = simpleResult;

  if (data.operator === "crosses_above" || data.operator === "crosses_below") {
    let prevAbove: boolean | null = null;
    try {
      prevAbove = await redis.get<boolean>(getRedisKey(nodeId));
    } catch {
      // Redis unreachable
    }

    const currentlyAbove = left > right;
    redis.set(getRedisKey(nodeId), currentlyAbove).catch(() => {});

    if (prevAbove === null) {
      result = false;
    } else if (data.operator === "crosses_above") {
      result = prevAbove === false && currentlyAbove === true;
    } else {
      result = prevAbove === true && currentlyAbove === false;
    }
  }

  if (!result) {
    await publish(conditionChannel().status({ nodeId, status: "skipped" }));
    throw new ConditionNotMetError(
      `Condition: ${data.leftPath} ${data.operator} ${data.rightPath ?? data.rightValue} was false`,
    );
  }

  await publish(conditionChannel().status({ nodeId, status: "success" }));
  return context;
};