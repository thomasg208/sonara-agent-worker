import { cli, ServerOptions, JobContext, voice } from '@livekit/agents';
import { fileURLToPath } from 'url';
import { createAgent } from './agent.js';
import { LatencyTracker } from './telemetry/latency.js';
import { config } from './config.js';

const __filename = fileURLToPath(import.meta.url);

/**
 * Entrypoint for the LiveKit Agent worker.
 * Connects to the room, starts the session, and greets the user.
 */
export async function agent_entrypoint(ctx: JobContext) {
    const tracker = new LatencyTracker();
    console.log('Wingman Agent Worker Booting...');

    // Enforce Max Session Duration
    const sessionTimeout = setTimeout(() => {
        console.log(`[Production] Session reached max duration (${config.production.maxSessionDurationSeconds}s). Shutting down.`);
        ctx.shutdown("MAX_DURATION_EXCEEDED");
    }, config.production.maxSessionDurationSeconds * 1000);

    const agent = createAgent();

    await ctx.connect();
    console.log('Connected to LiveKit');
    console.log('Waiting for participants...');

    // Default attributes
    if (ctx.room.localParticipant) {
        await ctx.room.localParticipant.setAttributes({
            tier: 'L1',
            rag_active: 'FALSE',
            billing_status: 'ACTIVE',
            latency: '0ms'
        });
    }

    const session = new voice.AgentSession({
        llm: agent.llm,
    });

    // Track response start/end for the greeting
    tracker.startResponse();
    await session.start({ agent, room: ctx.room });
    console.log(`[Session Started] Agent is now live in room: ${ctx.room.name}`);
    console.log('Agent session started');

    // Auto-greet user on join
    session.say("Wingman online. How can I optimize your sales deployment today?");

    // Listen for tool executions to update HUD attributes
    session.on(voice.AgentSessionEventTypes.FunctionToolsExecuted, (ev) => {
        ev.functionCalls.forEach((call, i) => {
            const output = ev.functionCallOutputs[i];
            if (!output) return;

            const updates: Record<string, string> = {};

            if (call.name === 'classifyMessage') {
                updates.tier = output.output;
            } else if (call.name === 'retrieveKnowledge') {
                updates.rag_active = 'ACTIVE';
            } else if (call.name === 'checkUsage') {
                try {
                    const res = JSON.parse(output.output);
                    updates.billing_status = res.status;
                } catch {
                    updates.billing_status = output.output;
                }
            }

            if (Object.keys(updates).length > 0 && ctx.room.localParticipant) {
                ctx.room.localParticipant.setAttributes(updates).catch(console.error);
            }
        });
    });

    session.on(voice.AgentSessionEventTypes.SpeechCreated, () => {
        tracker.startResponse();
    });

    ctx.addShutdownCallback(async () => {
        clearTimeout(sessionTimeout);
        console.log('Agent worker shutting down');
        await session.close();
    });
}

// Default export is required for LiveKit Worker to find the entrypoint
export default agent_entrypoint;

console.log('--- AGENT WORKER STARTING ---');
console.log('Argv:', process.argv[1]);
console.log('Filename:', __filename);

// Robust check for entrypoint start
const isEntrypoint = process.argv[1] === __filename ||
    process.argv[1]?.includes('entrypoint.ts') ||
    process.argv[1]?.includes('entrypoint.js');

if (isEntrypoint) {
    console.log('🟢 Starting LiveKit Agent Worker (CLI mode)...');
    cli.runApp(new ServerOptions({
        agent: __filename, // In ESM, __filename is essentially the same as import.meta.url but as a path
        agentName: 'sonara-agent-worker',
        wsURL: config.livekit.url,
        apiKey: config.livekit.apiKey,
        apiSecret: config.livekit.apiSecret,
    }));
} else {
    console.log('🟡 Running in module mode (Waiting for explicit start)');
}
