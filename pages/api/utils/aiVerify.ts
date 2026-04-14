import { GoogleGenAI, Type } from '@google/genai';
import { PDFParse } from 'pdf-parse';

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

interface EventDetails {
    title: string;
    description?: string;
    location?: string;
    start_date?: string;
    end_date?: string;
    start_time?: string;
    end_time?: string;
    category_name?: string;
    laboratory?: string;
    extra_context?: string;
}

interface VerificationResult {
    isValid: boolean;
    reasoning: string;
}

export async function verifyEventPDF(
    pdfBuffer: Buffer,
    eventDetails: EventDetails
): Promise<VerificationResult> {
    // 1. Extract text from the PDF using pdf-parse v2 API
    let pdfText: string;
    try {
        const parser = new PDFParse({ data: new Uint8Array(pdfBuffer) });
        const result = await parser.getText();
        pdfText = result.text;
        await parser.destroy();
    } catch (err: any) {
        console.error('PDF parse error:', err?.message || err);
        return {
            isValid: false,
            reasoning: 'Could not read the uploaded PDF. Please ensure it is a valid, non-corrupted PDF file.',
        };
    }

    if (!pdfText || pdfText.trim().length < 20) {
        return {
            isValid: false,
            reasoning: 'The uploaded PDF appears to be empty or contains very little text. Please upload a document that describes the event.',
        };
    }

    // 2. Build the prompt
    const prompt = `You are validating an event registration on a university platform.

A creator is trying to publish an event with the following details:
- Title: "${eventDetails.title}"
${eventDetails.description ? `- Description: "${eventDetails.description}"` : ''}
${eventDetails.location ? `- Location: "${eventDetails.location}"` : ''}
${eventDetails.start_date ? `- Start Date: "${eventDetails.start_date}"` : ''}
${eventDetails.end_date ? `- End Date: "${eventDetails.end_date}"` : ''}
${eventDetails.start_time ? `- Start Time: "${eventDetails.start_time}"` : ''}
${eventDetails.end_time ? `- End Time: "${eventDetails.end_time}"` : ''}
${eventDetails.category_name ? `- Category: "${eventDetails.category_name}"` : ''}
${eventDetails.laboratory ? `- Laboratory: "${eventDetails.laboratory}"` : ''}
${eventDetails.extra_context ? eventDetails.extra_context : ''}

They uploaded a PDF as proof. Here is the extracted text from the PDF:
---
${pdfText.substring(0, 4000)}
---

Your task:
1. Determine if the PDF is a LEGITIMATE document related to this event (e.g., an official announcement, poster, schedule, invitation, or program that references this event).
2. Focus on the ESSENTIAL details: the event title (or a very similar name) should appear or be clearly referenced. The PDF should be about the SAME event, not a completely unrelated document.
3. Do NOT require an exact match on every single field. Dates, times, and locations may not always be listed in the PDF, and that is acceptable.
4. The PDF is NOT valid if it is completely unrelated (e.g., a random receipt, a different event entirely, or gibberish text).

Respond ONLY with a valid JSON object (no markdown, no explanation outside the JSON):
{
  "isValid": true or false,
  "reasoning": "A brief explanation of why the PDF was accepted or rejected."
}`;

    console.log('\n===== AI VERIFICATION PROMPT =====\n', prompt, '\n===== END PROMPT =====\n');

    // 3. Call Gemini
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.1,
                maxOutputTokens: 1000,
                responseMimeType: 'application/json',
            }
        });

        const content = response.text?.trim();
        console.log('\n===== AI RAW RESPONSE =====\n', content, '\n===== END RESPONSE =====\n');
        if (!content) {
            return { isValid: true, reasoning: 'AI verification could not produce a response. Event allowed.' };
        }

        // Parse the JSON response
        let parsed;
        try {
            parsed = JSON.parse(content);
        } catch (parseErr) {
            console.error('Failed to parse AI response JSON. Raw content:', content);
            return {
                isValid: false,
                reasoning: 'AI verification produced an invalid response format. Please try again or use a clearer PDF.',
            };
        }

        return {
            isValid: !!parsed.isValid,
            reasoning: parsed.reasoning || 'No reasoning provided.',
        };
    } catch (err: any) {
        console.error('AI verification error:', err?.message || err);
        return { 
            isValid: false, 
            reasoning: 'AI verification service encountered an error. Please try again later.' 
        };
    }
}
