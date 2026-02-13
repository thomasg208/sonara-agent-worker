import { llm } from '@livekit/agents';
import { z } from 'zod';

/**
 * Tool to classify message complexity into L1-L4 tiers.
 * L1: greeting / simple
 * L2: objection / price
 * L3: consultative
 * L4: knowledge retrieval
 */
export const classifyMessage = llm.tool({
    description: 'Classify the complexity of a user message into L1, L2, L3, or L4 tiers.',
    parameters: z.object({
        message: z.string().describe('The user message to classify'),
    }),
    execute: async ({ message }) => {
        const msg = message.toLowerCase();
        console.log(`[Router] Classifying message: "${message}"`);

        // L1: greeting / simple
        if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.length < 10) {
            return 'L1';
        }

        // L2: objection / price
        if (msg.includes('price') || msg.includes('cost') || msg.includes('expensive') || msg.includes('budget')) {
            return 'L2';
        }

        // L4: knowledge retrieval
        if (msg.includes('explain') || msg.includes('trigger') || msg.includes('insight') || msg.includes('knowledge') || msg.includes('persuasion')) {
            return 'L4';
        }

        // L3: consultative
        return 'L3';
    },
});
