/**
 * Deprecated safety wrapper.
 *
 * The former script executed unversioned DDL against whichever database URL
 * happened to be present in .env.local. That bypassed migration review and
 * could write SWEEP data into an unrelated Supabase project.
 *
 * Use tracked files in supabase/migrations after the SWEEP project reference
 * is verified. Do not restore direct DDL execution here.
 */

throw new Error(
  'Direct database migration is disabled. Use reviewed Supabase migrations against the verified SWEEP Care project.'
);
