import { createGroq } from '@ai-sdk/groq';
import { generateText, streamText } from 'ai';

// Initialize Groq client
// You'll need to add your GROQ_API_KEY to your environment variables
const groq = createGroq({
  apiKey: process.env.EXPO_PUBLIC_GROQ_API_KEY || '',
});

export async function generateAIResponse(message: string): Promise<string> {
  try {
    const { text } = await generateText({
      model: groq('llama-3.1-8b-instant'),
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant. Provide concise, helpful responses.',
        },
        {
          role: 'user',
          content: message,
        },
      ],
      maxTokens: 500,
      temperature: 0.7,
    });

    return text;
  } catch (error) {
    console.error('AI Response Error:', error);
    return 'I apologize, but I encountered an error processing your request. Please try again.';
  }
}

export async function* streamAIResponse(message: string) {
  try {
    const { textStream } = await streamText({
      model: groq('llama-3.1-8b-instant'),
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant. Provide concise, helpful responses.',
        },
        {
          role: 'user',
          content: message,
        },
      ],
      maxTokens: 500,
      temperature: 0.7,
    });

    for await (const delta of textStream) {
      yield delta;
    }
  } catch (error) {
    console.error('AI Stream Error:', error);
    yield 'I apologize, but I encountered an error processing your request. Please try again.';
  }
}