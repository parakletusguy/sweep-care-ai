export interface OrganizationUnitNode {
  id: string;
  tenantId: string;
  parentId: string | null;
  name: string;
  unitType: string; // e.g. 'region', 'division', 'department', 'team', 'cohort'
  code?: string;
  metadata?: Record<string, unknown>;
}

export interface HydratedUnitNode extends OrganizationUnitNode {
  children: HydratedUnitNode[];
  path: string; // Materialized breadcrumb path, e.g., "EMEA / Engineering / Backend"
  depth: number;
}

/**
 * Arbitrary-Depth Organization Hierarchy Tree Manager (PRD §22)
 * Handles recursive structures, cycle prevention, path generation, and descendant aggregation.
 */
export class OrganizationTreeManager {
  /**
   * Validates and builds a hierarchical tree from a flat list of organization units.
   * Enforces tenant boundaries and prevents cycles.
   */
  public static buildTree(
    tenantId: string,
    flatUnits: OrganizationUnitNode[]
  ): HydratedUnitNode[] {
    // 1. Verify tenant isolation across all units (AC-001)
    for (const unit of flatUnits) {
      if (unit.tenantId !== tenantId) {
        throw new Error(
          `TenantIsolationViolation: Unit ${unit.id} belongs to tenant ${unit.tenantId}, expected ${tenantId}.`
        );
      }
    }

    // 2. Build index
    const nodeMap = new Map<string, HydratedUnitNode>();
    for (const unit of flatUnits) {
      nodeMap.set(unit.id, {
        ...unit,
        children: [],
        path: unit.name,
        depth: 0,
      });
    }

    // 3. Assemble tree and detect circular dependencies
    const rootNodes: HydratedUnitNode[] = [];

    for (const unit of flatUnits) {
      const node = nodeMap.get(unit.id)!;
      if (!unit.parentId) {
        rootNodes.push(node);
      } else {
        // Cycle check: verify unit is not an ancestor of its proposed parent
        if (this.isAncestor(unit.id, unit.parentId, nodeMap)) {
          throw new Error(
            `CircularHierarchyDetected: Node ${unit.id} cannot have descendant ${unit.parentId} as parent.`
          );
        }

        const parentNode = nodeMap.get(unit.parentId);
        if (parentNode) {
          parentNode.children.push(node);
        } else {
          // If parent not found, treat as root to avoid orphan loss
          rootNodes.push(node);
        }
      }
    }

    // 4. Compute materialized breadcrumb paths and depths
    const computePaths = (node: HydratedUnitNode, parentPath: string, depth: number) => {
      node.depth = depth;
      node.path = parentPath ? `${parentPath} / ${node.name}` : node.name;
      for (const child of node.children) {
        computePaths(child, node.path, depth + 1);
      }
    };

    for (const root of rootNodes) {
      computePaths(root, '', 0);
    }

    return rootNodes;
  }

  /**
   * Retrieves all descendant unit IDs of a given unit ID (including self).
   */
  public static getDescendantIds(
    unitId: string,
    flatUnits: OrganizationUnitNode[]
  ): string[] {
    const childrenMap = new Map<string, string[]>();
    for (const u of flatUnits) {
      if (u.parentId) {
        if (!childrenMap.has(u.parentId)) childrenMap.set(u.parentId, []);
        childrenMap.get(u.parentId)!.push(u.id);
      }
    }

    const descendants: string[] = [unitId];
    const queue = [unitId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const children = childrenMap.get(current) || [];
      for (const child of children) {
        descendants.push(child);
        queue.push(child);
      }
    }

    return descendants;
  }

  private static isAncestor(
    potentialAncestorId: string,
    targetId: string,
    nodeMap: Map<string, HydratedUnitNode>
  ): boolean {
    let currentId: string | null = targetId;
    const visited = new Set<string>();

    while (currentId) {
      if (currentId === potentialAncestorId) return true;
      if (visited.has(currentId)) break;
      visited.add(currentId);

      const node = nodeMap.get(currentId);
      currentId = node ? node.parentId : null;
    }

    return false;
  }
}
