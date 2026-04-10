import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { encrypt } from '../services/encryption.js';
import type { Config } from '../config.js';

const updateOrgSchema = z.object({
  name: z.string().min(1).optional(),
  mission: z.string().optional(),
  website: z.string().url().optional(),
  timezone: z.string().optional(),
  autonomy_level: z.enum(['suggestion', 'assisted', 'autonomous']).optional(),
});

const setApiKeySchema = z.object({
  anthropic_api_key: z.string().min(1),
});

export default async function orgRoutes(fastify: FastifyInstance) {
  // Get current org
  fastify.get('/v1/orgs/me', async (request) => {
    const { data: org, error } = await fastify.supabaseAdmin
      .from('orgs')
      .select('id, name, slug, mission, website, timezone, autonomy_level, plan, ai_enabled, onboarding_completed_at, anthropic_api_key_valid, created_at, updated_at')
      .eq('id', request.orgId)
      .single();

    if (error) throw error;
    return org;
  });

  // Update org
  fastify.patch('/v1/orgs/me', async (request) => {
    const body = updateOrgSchema.parse(request.body);

    const { data, error } = await fastify.supabaseAdmin
      .from('orgs')
      .update(body)
      .eq('id', request.orgId)
      .select()
      .single();

    if (error) throw error;
    return data;
  });

  // Set Anthropic API key (BYOK)
  fastify.post('/v1/orgs/me/api-key', async (request, reply) => {
    if (request.memberRole !== 'owner' && request.memberRole !== 'admin') {
      return reply.code(403).send({ error: 'Only admins can manage the API key' });
    }

    const { anthropic_api_key } = setApiKeySchema.parse(request.body);
    const config = fastify.config as Config;

    // Validate the key by making a test call
    const testResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropic_api_key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      }),
    });

    const keyValid = testResponse.ok;

    // Encrypt and store regardless (user might add credits later)
    const encryptedKey = encrypt(anthropic_api_key, config.ENCRYPTION_KEY);

    const { error } = await fastify.supabaseAdmin
      .from('orgs')
      .update({
        anthropic_api_key_encrypted: encryptedKey,
        anthropic_api_key_set_at: new Date().toISOString(),
        anthropic_api_key_valid: keyValid,
      })
      .eq('id', request.orgId);

    if (error) throw error;

    return {
      success: true,
      valid: keyValid,
      message: keyValid
        ? 'API key validated and saved successfully.'
        : 'API key saved but validation failed. Please check your key and account balance.',
    };
  });

  // Remove API key
  fastify.delete('/v1/orgs/me/api-key', async (request, reply) => {
    if (request.memberRole !== 'owner' && request.memberRole !== 'admin') {
      return reply.code(403).send({ error: 'Only admins can manage the API key' });
    }

    const { error } = await fastify.supabaseAdmin
      .from('orgs')
      .update({
        anthropic_api_key_encrypted: null,
        anthropic_api_key_set_at: null,
        anthropic_api_key_valid: false,
      })
      .eq('id', request.orgId);

    if (error) throw error;
    return { success: true, message: 'API key removed. AI features are now disabled.' };
  });

  // Get members
  fastify.get('/v1/orgs/me/members', async (request) => {
    const { data, error } = await fastify.supabaseAdmin
      .from('members')
      .select('id, user_id, role, slack_user_id, created_at')
      .eq('org_id', request.orgId);

    if (error) throw error;
    return data;
  });
}
