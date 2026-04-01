/**
 * Seed script for local development.
 *
 * Creates a demo user, organization, and membership so you can
 * sign in immediately after running migrations.
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 *   # or
 *   npm run db:seed
 *
 * Environment:
 *   Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *   from .env.local (loaded automatically via --env-file).
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// --- Config ---

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.error('Make sure .env.local exists with valid Supabase credentials.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Seed data ---

const DEMO_USER = {
  id: randomUUID(),
  email: 'demo@example.com',
  name: 'Demo User',
  password_hash: '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u', // "password123"
  email_verified: true,
};

const DEMO_ORG = {
  id: randomUUID(),
  name: 'Demo Organization',
  slug: 'demo',
  plan: 'pro',
};

// --- Helpers ---

async function upsertUser() {
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', DEMO_USER.email)
    .single();

  if (existing) {
    console.log(`  User "${DEMO_USER.email}" already exists, skipping.`);
    return existing.id;
  }

  const { error } = await supabase.from('users').insert(DEMO_USER);
  if (error) throw new Error(`Failed to create user: ${error.message}`);
  console.log(`  Created user "${DEMO_USER.email}"`);
  return DEMO_USER.id;
}

async function upsertOrganization() {
  const { data: existing } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', DEMO_ORG.slug)
    .single();

  if (existing) {
    console.log(`  Organization "${DEMO_ORG.slug}" already exists, skipping.`);
    return existing.id;
  }

  const { error } = await supabase.from('organizations').insert(DEMO_ORG);
  if (error) throw new Error(`Failed to create organization: ${error.message}`);
  console.log(`  Created organization "${DEMO_ORG.name}" (/${DEMO_ORG.slug})`);
  return DEMO_ORG.id;
}

async function upsertMembership(userId: string, orgId: string) {
  const { data: existing } = await supabase
    .from('organization_members')
    .select('id')
    .eq('user_id', userId)
    .eq('organization_id', orgId)
    .single();

  if (existing) {
    console.log('  Membership already exists, skipping.');
    return;
  }

  const { error } = await supabase.from('organization_members').insert({
    user_id: userId,
    organization_id: orgId,
    role: 'owner',
    status: 'active',
  });
  if (error) throw new Error(`Failed to create membership: ${error.message}`);
  console.log('  Created owner membership');
}

// --- Main ---

async function seed() {
  console.log('Seeding database...\n');

  const userId = await upsertUser();
  const orgId = await upsertOrganization();
  await upsertMembership(userId, orgId);

  console.log('\nDone! You can now sign in with:');
  console.log(`  Email:    ${DEMO_USER.email}`);
  console.log('  Password: password123');
  console.log(`  Org URL:  http://localhost:3000/${DEMO_ORG.slug}/dashboard\n`);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
