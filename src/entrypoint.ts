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
// 1. Define the entrypoint function
export async function agent_entrypoint(ctx: JobContext) {
    const tracker = new LatencyTracker();
    console.log('Wingman Agent Worker Booting...');

    const sessionTimeout = setTimeout(() => {
        console.log(`[Production] Session reached max duration (${config.production.maxSessionDurationSeconds}s). Shutting down.`);
        ctx.shutdown("MAX_DURATION_EXCEEDED");
    }, config.production.maxSessionDurationSeconds * 1000);

    const agent = createAgent();

    await ctx.connect();
    console.log('Connected to LiveKit');
    console.log('Waiting for participants...');

    if (ctx.room.localParticipant) {
        await ctx.room.localParticipant.setAttributes({
            tier: 'L1',
            rag_active: 'FALSE',
            billing_status: 'ACTIVE',
            latency: '0ms'
        });
    }

    const session = new voice.AgentSession({ llm: agent.llm });

    tracker.startResponse();
    await session.start({ agent, room: ctx.room });
    console.log(`[Session Started] Agent live in: ${ctx.room.name}`);

    session.say("Wingman online. How can I optimize your sales deployment today?");

    session.on(voice.AgentSessionEventTypes.FunctionToolsExecuted, (ev) => {
        ev.functionCalls.forEach((call, i) => {
            const output = ev.functionCallOutputs[i];
            if (!output) return;
            const updates: Record<string, string> = {};
            if (call.name === 'classifyMessage') updates.tier = output.output;
            else if (call.name === 'retrieveKnowledge') updates.rag_active = 'ACTIVE';
            else if (call.name === 'checkUsage') {
                try { updates.billing_status = JSON.parse(output.output).status; }
                catch { updates.billing_status = output.output; }
            }
            if (Object.keys(updates).length > 0 && ctx.room.localParticipant) {
                ctx.room.localParticipant.setAttributes(updates).catch(console.error);
            }
        });
    });

    session.on(voice.AgentSessionEventTypes.SpeechCreated, () => tracker.startResponse());

    ctx.addShutdownCallback(async () => {
        clearTimeout(sessionTimeout);
        console.log('Agent worker shutting down');
        await session.close();
    });
}

// 2. Export as default (Must be clean for the loader)
export default agent_entrypoint;

// 3. CLI Runner (Runs only when invoked directly)
if (process.argv[1]?.includes('entrypoint')) {
    if (!process.argv.slice(2).some(arg => ['start', 'dev', 'download-files'].includes(arg))) {
        process.argv.push('start');
    }
    cli.runApp(new ServerOptions({
        agent: fileURLToPath(import.meta.url),
        agentName: 'sonara-agent-worker',
        wsURL: config.livekit.url,
        apiKey: config.livekit.apiKey,
        apiSecret: config.livekit.apiSecret,
    }));
}
