/**
 * Deprecated safety wrapper.
 *
 * Seed data must be deterministic, non-production, and executed only after
 * the target Supabase project has been verified. The prior script connected
 * directly to the URL in .env.local and could create sensitive-looking demo
 * records in an unrelated project.
 */

throw new Error(
  'Direct database seeding is disabled. Use reviewed non-production seed migrations against the verified SWEEP Care project.'
);
