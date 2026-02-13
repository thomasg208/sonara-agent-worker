import { llm } from '@livekit/agents';
import { z } from 'zod';

/**
 * Tool to check usage limits for a given tenant.
 * Simulates an EXCEEDED status for "demo-limit".
 */
export const checkUsage = llm.tool({
    description: 'Check the billing and usage status for a tenant to ensure they have not exceeded their limits.',
    parameters: z.object({
        tenantId: z.string().describe('The unique identifier for the tenant'),
    }),
    execute: async ({ tenantId }) => {
        console.log(`[Billing] Checking usage for tenant: ${tenantId}`);

        if (tenantId === 'demo-limit') {
            return { status: 'EXCEEDED' };
        }

        return { status: 'ACTIVE' };
    },
});
