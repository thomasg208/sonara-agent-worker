import { beta } from '@livekit/agents-plugin-google';
import dotenv from 'dotenv';
dotenv.config();

try {
    const model = new beta.realtime.RealtimeModel({
        model: 'gemini-2.0-flash-exp', // Trying a more realistic model name
        apiKey: process.env.GOOGLE_API_KEY
    });
    console.log('✅ Model initialized with gemini-2.0-flash-exp');
} catch (e) {
    console.error('❌ Failed with gemini-2.0-flash-exp:', e.message);
}

try {
    const model = new beta.realtime.RealtimeModel({
        model: 'gemini-1.5-flash',
        apiKey: process.env.GOOGLE_API_KEY
    });
    console.log('✅ Model initialized with gemini-1.5-flash');
} catch (e) {
    console.error('❌ Failed with gemini-1.5-flash:', e.message);
}
