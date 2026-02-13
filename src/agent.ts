import { voice } from '@livekit/agents';
import { beta } from '@livekit/agents-plugin-google';
import { WINGMAN_CORE_IDENTITY } from './wingman/coreIdentity.js';
import { classifyMessage } from './wingman/router.js';
import { retrieveKnowledge } from './wingman/rag.js';
import { checkUsage } from './wingman/billing.js';
import { config } from './config.js';

/**
 * Creates a LiveKit Agent using Gemini Native Audio.
 * Configured with production-safe temperature and identity.
 */
export function createAgent() {
    const model = new beta.realtime.RealtimeModel({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        voice: 'Puck',
        temperature: config.production.safeTemperatureBounds.default,
        modalities: ['audio' as any],
    });

    console.log("Agent initialized");

    return new voice.Agent({
        instructions: WINGMAN_CORE_IDENTITY + "\n\nCRITICAL: Always call checkUsage before starting a consultative or deep knowledge retrieval session.",
        llm: model,
        allowInterruptions: true,
        tools: {
            classifyMessage,
            retrieveKnowledge,
            checkUsage
        }
    });
}
