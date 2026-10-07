import { LmsCourse, LmsPlatform } from './types';
import { TenantContextStore } from '../tenancy/tenant-context';
import { AuditLogger } from '../audit/audit-logger';
import { DataClassification } from '../audit/types';

/**
 * Phase 2C: LMS Rostering & Cohort Synchronization Manager (PRD §70)
 * Synchronizes educational cohorts and student rosters from Canvas and Moodle.
 */
export class LmsSyncManager {
  private static courses: Map<string, LmsCourse[]> = new Map();

  /**
   * Synchronizes an LMS course roster to a tenant cohort.
   */
  public static syncCourseRoster(
    tenantId: string,
    platform: LmsPlatform,
    course: LmsCourse
  ): LmsCourse {
    TenantContextStore.assertTenantMatch(tenantId);

    const tenantCourses = this.courses.get(tenantId) || [];
    const existingIndex = tenantCourses.findIndex((c) => c.courseId === course.courseId);

    if (existingIndex >= 0) {
      tenantCourses[existingIndex] = course;
    } else {
      tenantCourses.push(course);
    }

    this.courses.set(tenantId, tenantCourses);

    AuditLogger.log({
      tenantId,
      actorId: `LMS_SYNC_${platform}`,
      action: 'UPDATE',
      classification: DataClassification.CLASS_C_PERSONAL,
      resourceType: 'LmsCourseCohort',
      resourceId: course.courseId,
      metadata: {
        platform,
        studentCount: course.studentIds.length,
        courseCode: course.courseCode,
      },
    });

    return course;
  }

  /**
   * Retrieves synced LMS courses for a tenant.
   */
  public static getCoursesForTenant(tenantId: string): LmsCourse[] {
    TenantContextStore.assertTenantMatch(tenantId);
    return this.courses.get(tenantId) || [];
  }

  public static _clearForTesting(): void {
    this.courses.clear();
  }
}
