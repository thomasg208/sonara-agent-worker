import { classifyMessage } from './wingman/router.js';
import { retrieveKnowledge } from './wingman/rag.js';

async function test() {
    console.log("--- Testing classifyMessage ---");
    const testCases = [
        "Hello",
        "What are your pricing options?",
        "Explain persuasion triggers",
        "How can I scale my team?"
    ];

    for (const msg of testCases) {
        // @ts-ignore - Mocking the execution context for simple logic check
        const result = await classifyMessage.execute({ message: msg }, {} as any);
        console.log(`Message: "${msg}" -> Result: ${result}`);
    }

    console.log("\n--- Testing retrieveKnowledge ---");
    // @ts-ignore
    const ragResult = await retrieveKnowledge.execute({ query: "persuasion triggers" }, {} as any);
    console.log(`RAG Result: ${ragResult}`);
}

test().catch(console.error);
