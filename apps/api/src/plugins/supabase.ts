import fp from 'fastify-plugin';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { FastifyInstance } from 'fastify';
import type { Config } from '../config.js';

declare module 'fastify' {
  interface FastifyInstance {
    supabase: SupabaseClient;
    supabaseAdmin: SupabaseClient;
  }
}

export default fp(async function supabasePlugin(fastify: FastifyInstance) {
  const config = fastify.config as Config;

  // Public client (respects RLS via user JWT)
  const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);

  // Service role client (bypasses RLS for background operations)
  const supabaseAdmin = createClient(
    config.SUPABASE_URL,
    config.SUPABASE_SERVICE_ROLE_KEY
  );

  fastify.decorate('supabase', supabase);
  fastify.decorate('supabaseAdmin', supabaseAdmin);
});
