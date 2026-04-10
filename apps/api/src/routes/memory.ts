import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

const createMemorySchema = z.object({
  category: z.enum([
    'mission', 'programs', 'donors', 'grants', 'campaigns',
    'brand_voice', 'contacts', 'processes', 'general',
  ]),
  title: z.string().min(1),
  content: z.string().min(1),
  source: z.string().optional(),
});

const updateMemorySchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  category: z.enum([
    'mission', 'programs', 'donors', 'grants', 'campaigns',
    'brand_voice', 'contacts', 'processes', 'general',
  ]).optional(),
});

export default async function memoryRoutes(fastify: FastifyInstance) {
  // List memory entries
  fastify.get('/v1/orgs/me/memory', async (request) => {
    const url = new URL(request.url, 'http://localhost');
    const category = url.searchParams.get('category');

    let query = fastify.supabaseAdmin
      .from('memory_entries')
      .select('id, org_id, category, title, content, source, auto_generated, created_at, updated_at')
      .eq('org_id', request.orgId)
      .order('category')
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  });

  // Create memory entry
  fastify.post('/v1/orgs/me/memory', async (request) => {
    const body = createMemorySchema.parse(request.body);

    const { data: member } = await fastify.supabaseAdmin
      .from('members')
      .select('id')
      .eq('user_id', request.userId)
      .eq('org_id', request.orgId)
      .single();

    const { data, error } = await fastify.supabaseAdmin
      .from('memory_entries')
      .insert({
        org_id: request.orgId,
        ...body,
        created_by: member?.id,
      })
      .select()
      .single();

    if (error) throw error;

    // TODO: Generate embedding asynchronously via queue

    return data;
  });

  // Update memory entry
  fastify.patch<{ Params: { entryId: string } }>(
    '/v1/orgs/me/memory/:entryId',
    async (request) => {
      const body = updateMemorySchema.parse(request.body);

      const { data, error } = await fastify.supabaseAdmin
        .from('memory_entries')
        .update(body)
        .eq('id', request.params.entryId)
        .eq('org_id', request.orgId)
        .select()
        .single();

      if (error) throw error;

      // TODO: Regenerate embedding if content changed

      return data;
    }
  );

  // Delete memory entry
  fastify.delete<{ Params: { entryId: string } }>(
    '/v1/orgs/me/memory/:entryId',
    async (request) => {
      const { error } = await fastify.supabaseAdmin
        .from('memory_entries')
        .delete()
        .eq('id', request.params.entryId)
        .eq('org_id', request.orgId);

      if (error) throw error;
      return { success: true };
    }
  );

  // Semantic search
  fastify.post('/v1/orgs/me/memory/search', async (request) => {
    const { query } = z.object({ query: z.string().min(1) }).parse(request.body);

    // TODO: Generate embedding for query, then use pgvector similarity search
    // For now, do a text search fallback
    const { data, error } = await fastify.supabaseAdmin
      .from('memory_entries')
      .select('*')
      .eq('org_id', request.orgId)
      .ilike('content', `%${query}%`)
      .limit(10);

    if (error) throw error;
    return data;
  });
}
