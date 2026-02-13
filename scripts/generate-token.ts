import { AccessToken } from 'livekit-server-sdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;

if (!API_KEY || !API_SECRET) {
    console.error('❌ Error: LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be set in .env');
    process.exit(1);
}

const createToken = async () => {
    const roomName = 'sonara-demo-room';
    const participantName = 'strategic-executive-' + Math.floor(Math.random() * 1000);

    const at = new AccessToken(API_KEY, API_SECRET, {
        identity: participantName,
    });

    at.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: true,
        canSubscribe: true,
    });

    const token = await at.toJwt();

    console.log('\n--- SONARA TOKEN GENERATED ---');
    console.log('Room: ', roomName);
    console.log('Participant: ', participantName);
    console.log('\nTOKEN:');
    console.log(token);
    console.log('\n------------------------------');
};

createToken().catch(console.error);
