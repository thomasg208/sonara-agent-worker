import { RoomServiceClient } from 'livekit-server-sdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const {
    LIVEKIT_URL,
    LIVEKIT_API_KEY,
    LIVEKIT_API_SECRET
} = process.env;

if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    console.error('❌ Missing credentials in .env');
    process.exit(1);
}

const svcUrl = LIVEKIT_URL.replace('wss://', 'https://').replace('ws://', 'http://');

async function runCheck() {
    console.log('🚀 LiveKit Health Check...');
    const svc = new RoomServiceClient(svcUrl, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

    try {
        const rooms = await svc.listRooms();
        console.log(`\nActive Rooms: ${rooms.length}`);
        rooms.forEach(r => console.log(`- ${r.name} (${r.numParticipants} participants)`));

        if (rooms.length === 0) {
            console.log('\n😴 No active rooms found. The Agent is idling (Waiting for you to join).');
            console.log('\n👉 ACTION: Please open http://localhost:3000 and click "Initialize" to wake the agent.');
        } else {
            const participants = await svc.listParticipants(rooms[0].name);
            console.log(`\nParticipants in ${rooms[0].name}:`);
            participants.forEach(p => console.log(`- ${p.identity}`));
        }

    } catch (err) {
        console.error('❌ API Error:', err.message);
    }
}

runCheck().catch(console.error);
