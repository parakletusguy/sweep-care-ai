import { describe, it, expect } from 'vitest';
import {
  OrganizationTreeManager,
  OrganizationUnitNode,
} from '@/domain/structure/organization-tree';

describe('Sprint 1.2: Arbitrary-Depth Organization Hierarchy (PRD §22)', () => {
  const tenantId = 'tenant-acme';

  const flatUnits: OrganizationUnitNode[] = [
    { id: 'u-corp', tenantId, parentId: null, name: 'Acme Global', unitType: 'organization' },
    { id: 'u-emea', tenantId, parentId: 'u-corp', name: 'EMEA Region', unitType: 'region' },
    { id: 'u-uk', tenantId, parentId: 'u-emea', name: 'UK Office', unitType: 'location' },
    { id: 'u-eng', tenantId, parentId: 'u-uk', name: 'Engineering', unitType: 'department' },
    { id: 'u-backend', tenantId, parentId: 'u-eng', name: 'Backend Team', unitType: 'team' },
    { id: 'u-apac', tenantId, parentId: 'u-corp', name: 'APAC Region', unitType: 'region' },
  ];

  it('builds a multi-level hierarchical tree with correct breadcrumb paths and depths', () => {
    const tree = OrganizationTreeManager.buildTree(tenantId, flatUnits);

    expect(tree.length).toBe(1); // One root: Acme Global
    const root = tree[0];
    expect(root.name).toBe('Acme Global');
    expect(root.depth).toBe(0);
    expect(root.children.length).toBe(2); // EMEA and APAC

    const emea = root.children.find((c) => c.name === 'EMEA Region')!;
    expect(emea.depth).toBe(1);
    expect(emea.path).toBe('Acme Global / EMEA Region');

    const uk = emea.children.find((c) => c.name === 'UK Office')!;
    const eng = uk.children.find((c) => c.name === 'Engineering')!;
    const backend = eng.children.find((c) => c.name === 'Backend Team')!;

    expect(backend.depth).toBe(4);
    expect(backend.path).toBe(
      'Acme Global / EMEA Region / UK Office / Engineering / Backend Team'
    );
  });

  it('aggregates all descendant unit IDs for cohort analytics', () => {
    const emeaDescendants = OrganizationTreeManager.getDescendantIds('u-emea', flatUnits);
    // u-emea + u-uk + u-eng + u-backend
    expect(emeaDescendants).toContain('u-emea');
    expect(emeaDescendants).toContain('u-uk');
    expect(emeaDescendants).toContain('u-eng');
    expect(emeaDescendants).toContain('u-backend');
    expect(emeaDescendants).not.toContain('u-apac');
    expect(emeaDescendants.length).toBe(4);
  });

  it('detects and prevents circular hierarchy loops', () => {
    const cyclicUnits: OrganizationUnitNode[] = [
      { id: 'node-1', tenantId, parentId: 'node-3', name: 'Node 1', unitType: 'team' },
      { id: 'node-2', tenantId, parentId: 'node-1', name: 'Node 2', unitType: 'team' },
      { id: 'node-3', tenantId, parentId: 'node-2', name: 'Node 3', unitType: 'team' },
    ];

    expect(() => {
      OrganizationTreeManager.buildTree(tenantId, cyclicUnits);
    }).toThrowError(/CircularHierarchyDetected/);
  });

  it('strictly rejects units from foreign tenants (AC-001)', () => {
    const contaminatedUnits: OrganizationUnitNode[] = [
      ...flatUnits,
      { id: 'u-foreign', tenantId: 'tenant-other', parentId: null, name: 'Spy Unit', unitType: 'team' },
    ];

    expect(() => {
      OrganizationTreeManager.buildTree(tenantId, contaminatedUnits);
    }).toThrowError(/TenantIsolationViolation/);
  });
});
