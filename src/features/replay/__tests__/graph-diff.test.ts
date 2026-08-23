
import { describe, it, expect } from "vitest";
import { diffGraphs } from "../lib/graph-diff";

const savedNode = (id: string, type: string, data: Record<string, unknown> = {}) => ({ id, type, data });
const savedConn = (fromNodeId: string, toNodeId: string) => ({ fromNodeId, toNodeId });

describe("diffGraphs", () => {
  it("marks nothing changed when saved and draft graphs are identical", () => {
    const nodes = [savedNode("a", "HTTP_REQUEST", { url: "x" }), savedNode("b", "SLACK", { msg: "y" })];
    const conns = [savedConn("a", "b")];

    const result = diffGraphs(nodes, conns, nodes, conns.map((c) => ({ fromNodeId: c.fromNodeId, toNodeId: c.toNodeId })));

    expect(result.changedNodeIds.size).toBe(0);
    expect(result.reExecuteNodeIds.size).toBe(0);
  });

  it("marks a node with changed data as changed, and downstream nodes as re-execute", () => {
    const saved = [savedNode("a", "INDICATOR", { period: 10 }), savedNode("b", "CONDITION", {}), savedNode("c", "ORDER", {})];
    const savedConns = [savedConn("a", "b"), savedConn("b", "c")];

    const draft = [
      { id: "a", type: "INDICATOR", data: { period: 20 } }, // changed
      { id: "b", type: "CONDITION", data: {} },
      { id: "c", type: "ORDER", data: {} },
    ];
    const draftConns = [{ fromNodeId: "a", toNodeId: "b" }, { fromNodeId: "b", toNodeId: "c" }];

    const result = diffGraphs(saved, savedConns, draft, draftConns);

    expect(result.changedNodeIds).toEqual(new Set(["a"]));
    // b and c are downstream of the changed node a — both must re-execute
    expect(result.reExecuteNodeIds).toEqual(new Set(["a", "b", "c"]));
  });

  it("does NOT mark an unrelated sibling branch as needing re-execution", () => {
    // a -> b (changed)
    // a -> c (unrelated branch, untouched)
    const saved = [savedNode("a", "MARKET_DATA_TRIGGER"), savedNode("b", "INDICATOR", { period: 10 }), savedNode("c", "INDICATOR", { period: 30 })];
    const savedConns = [savedConn("a", "b"), savedConn("a", "c")];

    const draft = [
      { id: "a", type: "MARKET_DATA_TRIGGER", data: {} },
      { id: "b", type: "INDICATOR", data: { period: 20 } }, // changed
      { id: "c", type: "INDICATOR", data: { period: 30 } }, // unchanged
    ];
    const draftConns = [{ fromNodeId: "a", toNodeId: "b" }, { fromNodeId: "a", toNodeId: "c" }];

    const result = diffGraphs(saved, savedConns, draft, draftConns);

    expect(result.reExecuteNodeIds.has("b")).toBe(true);
    expect(result.reExecuteNodeIds.has("c")).toBe(false); // sibling branch, must NOT be swept in
  });

  it("treats a new node as changed", () => {
    const saved = [savedNode("a", "HTTP_REQUEST")];
    const draft = [{ id: "a", type: "HTTP_REQUEST", data: {} }, { id: "new", type: "SLACK", data: {} }];

    const result = diffGraphs(saved, [], draft, []);

    expect(result.changedNodeIds.has("new")).toBe(true);
  });

  it("treats a removed edge as a change on the (formerly) downstream node", () => {
    const saved = [savedNode("a", "HTTP_REQUEST"), savedNode("b", "SLACK")];
    const savedConns = [savedConn("a", "b")];
    const draft = [{ id: "a", type: "HTTP_REQUEST", data: {} }, { id: "b", type: "SLACK", data: {} }];
    const draftConns: { fromNodeId: string; toNodeId: string }[] = []; // edge removed

    const result = diffGraphs(saved, savedConns, draft, draftConns);

    expect(result.changedNodeIds.has("b")).toBe(true);
  });

  it("detects a removed node", () => {
    const saved = [savedNode("a", "HTTP_REQUEST"), savedNode("b", "SLACK")];
    const draft = [{ id: "a", type: "HTTP_REQUEST", data: {} }];

    const result = diffGraphs(saved, [], draft, []);

    expect(result.removedNodeIds).toEqual(new Set(["b"]));
  });

  it("does not loop forever on a diamond-shaped downstream fan-in", () => {
    // a -> b -> d
    // a -> c -> d
    const saved = [savedNode("a", "T"), savedNode("b", "T"), savedNode("c", "T"), savedNode("d", "T")];
    const savedConns = [savedConn("a", "b"), savedConn("a", "c"), savedConn("b", "d"), savedConn("c", "d")];
    const draft = saved.map((n) => ({ id: n.id, type: n.type, data: { changed: n.id === "a" ? 1 : 0 } }));
    const draftConns = savedConns.map((c) => ({ fromNodeId: c.fromNodeId, toNodeId: c.toNodeId }));

    const result = diffGraphs(saved, savedConns, draft, draftConns);

    expect(result.reExecuteNodeIds).toEqual(new Set(["a", "b", "c", "d"]));
  });
});