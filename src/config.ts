import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
    LIVEKIT_URL: z.string().url(),
    LIVEKIT_API_KEY: z.string().min(1, "LIVEKIT_API_KEY is required"),
    LIVEKIT_API_SECRET: z.string().min(1, "LIVEKIT_API_SECRET is required"),
    GOOGLE_API_KEY: z.string().min(1, "GOOGLE_API_KEY is required"),
});

// Fail fast if misconfigured
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error('❌ Invalid environment configuration:');
    console.error(parsedEnv.error.flatten().fieldErrors);
    process.exit(1);
}

export const config = {
    livekit: {
        url: parsedEnv.data.LIVEKIT_URL,
        apiKey: parsedEnv.data.LIVEKIT_API_KEY,
        apiSecret: parsedEnv.data.LIVEKIT_API_SECRET,
    },
    google: {
        apiKey: parsedEnv.data.GOOGLE_API_KEY,
    },
    production: {
        maxSessionDurationSeconds: 3600, // 1 hour cap
        maxConcurrentJobs: 10,
        safeTemperatureBounds: {
            min: 0.1,
            max: 1.0,
            default: 0.8
        }
    }
};
