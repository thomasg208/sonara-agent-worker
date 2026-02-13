import { Room, RoomEvent, createLocalAudioTrack } from 'livekit-client';
import dotenv from 'dotenv';
import { AccessToken } from 'livekit-server-sdk';

dotenv.config();

const URL = process.env.LIVEKIT_URL || 'ws://localhost:7880';
const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;

async function createToken(roomName: string, participantName: string) {
    const at = new AccessToken(API_KEY, API_SECRET, {
        identity: participantName,
    });
    at.addGrant({ roomJoin: true, room: roomName });
    return await at.toJwt();
}

async function simulateSession(id: number) {
    const roomName = `stress-test-room-${id}`;
    const participantName = `stress-participant-${id}`;
    const token = await createToken(roomName, participantName);

    const room = new Room();

    const startTime = Date.now();
    let firstResponseTime: number | null = null;

    room.on(RoomEvent.TrackSubscribed, (track: any) => {
        if (track.kind === 'audio') {
            if (firstResponseTime === null) {
                firstResponseTime = Date.now();
                console.log(`[Session ${id}] First audio response in ${firstResponseTime - startTime}ms`);
            }
        }
    });

    await room.connect(URL, token);
    console.log(`[Session ${id}] Connected`);

    // Publish audio track to trigger agent
    const audioTrack = await createLocalAudioTrack();
    await room.localParticipant.publishTrack(audioTrack);

    // Rapid voice triggers simulation (send some audio data if possible, or just wait)
    // For simplicity in this script, we'll just wait for the agent to greet.

    await new Promise(resolve => setTimeout(resolve, 10000));

    await room.disconnect();
    return firstResponseTime ? firstResponseTime - startTime : null;
}

async function runStressTest() {
    const CONCURRENT_SESSIONS = 20;
    console.log(`Starting stress test with ${CONCURRENT_SESSIONS} concurrent sessions...`);

    const results = await Promise.allSettled(
        Array.from({ length: CONCURRENT_SESSIONS }).map((_, i) => simulateSession(i))
    );

    const latencies = results
        .filter((r): r is PromiseFulfilledResult<number | null> => r.status === 'fulfilled' && r.value !== null)
        .map(r => r.value as number);

    const totalCrashes = results.filter(r => r.status === 'rejected').length;
    const dropCount = CONCURRENT_SESSIONS - latencies.length;
    const dropRate = (dropCount / CONCURRENT_SESSIONS) * 100;
    const avgLatency = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;

    console.log('\n--- Stress Test Results ---');
    console.log(`Total Sessions: ${CONCURRENT_SESSIONS}`);
    console.log(`Crashes: ${totalCrashes}`);
    console.log(`Drop Rate: ${dropRate.toFixed(2)}%`);
    console.log(`Avg Latency: ${(avgLatency / 1000).toFixed(2)}s`);

    if (totalCrashes === 0 && dropRate < 5 && avgLatency < 2500) {
        console.log('✅ TEST PASSED');
    } else {
        console.log('❌ TEST FAILED');
    }
}

runStressTest().catch(console.error);
