
type SavedNodeShape = { id: string; type: string; data: unknown };
type SavedConnectionShape = { fromNodeId: string; toNodeId: string };

type DraftNode = { id: string; type?: string | null; data?: Record<string, unknown> };
type DraftConnection = { fromNodeId: string; toNodeId: string };

export interface GraphDiffResult {
  changedNodeIds: Set<string>;
  removedNodeIds: Set<string>;
  reExecuteNodeIds: Set<string>;
}

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

  for (const c of savedConnections) {
    if (!draftEdgeSet.has(savedEdgeKey(c))) {
      changedNodeIds.add(c.toNodeId);
    }
  }

  const removedNodeIds = new Set(
    savedNodes.filter((n) => !draftNodes.some((d) => d.id === n.id)).map((n) => n.id),
  );

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