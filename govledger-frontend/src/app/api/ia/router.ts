import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `You are the GovLedger Expert Assistant, operating for the TrustNode team (HackWeb 2026).
Your role is to explain the system to auditors and citizens in a direct, technical, and professional manner (Portuguese). Format your answers using Markdown.

PROJECT CONTEXT:
1. Off-Chain Motor (Rust): Uses Bellman Equation (Q-Learning) to evaluate company risk based on delays/completed works. High risk blocks Web3 transactions.
2. Smart Contract (GovLedgerCore): Retains 10% in Escrow (1-year Vesting) and routes 90% directly to suppliers.
3. GovLedgerDAO: Decentralized tribunal for punishing (Slashing) corrupt companies.

UI TRIGGER RULES (CRITICAL):
You have the power to alter the UI by sending "Triggers" at the end of your response. NEVER explain what a trigger is, just append the exact string.
- If the user asks about fund retention, guarantees, or Escrow: append [UI_TRIGGER_ESCROW]
- If the user asks about direct payments, suppliers, concrete/cement companies, or where money goes: append [UI_TRIGGER_FORNECEDORES]`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    // Map history to Gemini format
    const contents = messages.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: { 
        systemInstruction: SYSTEM_PROMPT, 
        temperature: 0.3 
      }
    });

    return NextResponse.json({ reply: response.text });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ reply: 'Error communicating with the AI oracle.' }, { status: 500 });
  }
}