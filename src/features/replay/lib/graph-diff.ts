// src/features/replay/lib/graph-diff.ts
// Deliberately NOT typed against full Prisma Node/Connection — these values
// often arrive after passing through an Inngest step.run() boundary, which
// JSON-round-trips them (Date fields become strings at the type level).
// This function only ever reads id/type/data, so it's typed against that
// minimal shape instead of fighting the step.run() serialization boundary.
type SavedNodeShape = { id: string; type: string; data: unknown };
type SavedConnectionShape = { fromNodeId: string; toNodeId: string };

type DraftNode = { id: string; type?: string | null; data?: Record<string, unknown> };
type DraftConnection = { fromNodeId: string; toNodeId: string };

export interface GraphDiffResult {
  /** Nodes whose config changed, or are new, or gained/lost an inbound edge. */
  changedNodeIds: Set<string>;
  /** Nodes present in the saved graph but removed in the draft. */
  removedNodeIds: Set<string>;
  /**
   * changedNodeIds plus everything topologically downstream of them (in the
   * DRAFT graph). This is the full set of nodes that must actually be
   * re-executed during a shadow replay — everything else can safely reuse
   * its recorded output from the original execution.
   */
  reExecuteNodeIds: Set<string>;
}

/**
 * Compares a saved workflow graph against a draft (unsaved) graph to find
 * the minimal set of nodes that need real re-execution during a shadow
 * replay. Everything NOT in reExecuteNodeIds can safely reuse its recorded
 * output from history — deterministic, free, and avoids the two problems a
 * "replay everything" approach would have: real API calls on every replay,
 * and non-deterministic nodes (AI, live prices) producing diff noise on
 * nodes that didn't actually change.
 */
export function diffGraphs(
  savedNodes: SavedNodeShape[],
  savedConnections: SavedConnectionShape[],
  draftNodes: DraftNode[],
  draftConnections: DraftConnection[],
): GraphDiffResult {
  const savedNodeMap = new Map(savedNodes.map((n) => [n.id, n]));
  const changedNodeIds = new Set<string>();

  for (const draftNode of draftNodes) {
    const saved = savedNodeMap.get(draftNode.id);
    if (!saved) {
      // New node — definitely needs to run for real.
      changedNodeIds.add(draftNode.id);
      continue;
    }
    if (saved.type !== draftNode.type) {
      changedNodeIds.add(draftNode.id);
      continue;
    }
    const savedDataStr = JSON.stringify(saved.data ?? {});
    const draftDataStr = JSON.stringify(draftNode.data ?? {});
    if (savedDataStr !== draftDataStr) {
      changedNodeIds.add(draftNode.id);
    }
  }

  // A changed inbound edge counts as a change on the downstream node — its
  // input is different even if its own config isn't.
  const savedEdgeKey = (c: { fromNodeId: string; toNodeId: string }) =>
    `${c.fromNodeId}->${c.toNodeId}`;
  const savedEdgeSet = new Set(savedConnections.map(savedEdgeKey));
  const draftEdgeSet = new Set(draftConnections.map(savedEdgeKey));

  for (const c of draftConnections) {
    if (!savedEdgeSet.has(savedEdgeKey(c))) {
      changedNodeIds.add(c.toNodeId);
    }
  }
  // An edge that existed before and was REMOVED also changes the
  // downstream node's effective inputs.
  for (const c of savedConnections) {
    if (!draftEdgeSet.has(savedEdgeKey(c))) {
      changedNodeIds.add(c.toNodeId);
    }
  }

  const removedNodeIds = new Set(
    savedNodes.filter((n) => !draftNodes.some((d) => d.id === n.id)).map((n) => n.id),
  );

  // BFS downstream from every changed node, using the DRAFT graph's edges
  // (that's the graph we're about to actually run).
  const adjacency = new Map<string, string[]>();
  for (const c of draftConnections) {
    adjacency.set(c.fromNodeId, [...(adjacency.get(c.fromNodeId) ?? []), c.toNodeId]);
  }

  const reExecuteNodeIds = new Set(changedNodeIds);
  const queue = [...changedNodeIds];
  while (queue.length) {
    const current = queue.shift()!;
    for (const next of adjacency.get(current) ?? []) {
      if (!reExecuteNodeIds.has(next)) {
        reExecuteNodeIds.add(next);
        queue.push(next);
      }
    }
  }

  return { changedNodeIds, removedNodeIds, reExecuteNodeIds };
}