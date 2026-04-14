import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({
    apiKey: 'AIzaSyAmS38taUnarNrjXbSrl8TATZIXKW6fgu0',
});

async function run() {
    console.log("Asking Gemini a simple question in JSON mode...\n");
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "What is the capital of France? Reply strictly in JSON format.",
            config: {
                temperature: 0.1,
                maxOutputTokens: 100,
                responseSchema: {
                    type: 'OBJECT',
                    properties: {
                        isValid: { type: 'BOOLEAN' },
                        reasoning: { type: 'STRING' },
                        capital: { type: 'STRING' }
                    },
                    required: ['isValid', 'reasoning', 'capital']
                },
                responseMimeType: 'application/json',
            }
        });
        
        console.log("Raw Response String:");
        console.log(response.text?.trim());
        console.log("\nParsed JSON Object:");
        console.log(JSON.parse(response.text?.trim() || '{}'));
        console.log("\n✅ Test completed successfully!");
    } catch (err: any) {
        console.error("❌ Test failed:", err?.message || err);
    }
}

run();
