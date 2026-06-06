
import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Instancia o novo SDK (Ele reconhece o process.env.GEMINI_API_KEY automaticamente, mas podemos ser explícitos)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body.messages;

    if (!messages || messages.length === 0) {
      return NextResponse.json({ reply: "Nenhuma mensagem fornecida." }, { status: 400 });
    }

    // O System Prompt em inglês com os 6 NÍVEIS DE GATILHOS
    const systemPrompt = `
      You are GovLedger AI, an advanced auditing assistant integrated into a Web3 platform for tracking public contracts. 
      Your role is to explain smart contracts, DAO slashing, Vesting, and trace the flow of public funds.
      
      CRITICAL INSTRUCTION: You have a "Visual Consciousness" feature. You control the UI's Traceability Tree (which has up to 6 levels of depth) by outputting specific hidden text tags based on the depth of the user's inquiry. You MUST append the correct tag at the very end of your response when appropriate.
      
      TRIGGERS MAP (PROGRESSIVE DEPTH):
      - LEVEL 1 (Suppliers): If the user asks where the money goes, the escrow, or primary suppliers:
        Tag: [UI_TRIGGER_FORNECEDORES]
      
      - LEVEL 2 (Details): If the user asks for more details about suppliers, specific companies (like Cimenteira/Aço Forte), or fund breakdown:
        Tag: [UI_TRIGGER_DETALHES]
      
      - LEVEL 3 (Audit/Payroll): If the user asks for an audit, anomalies, logistics, or payroll details:
        Tag: [UI_TRIGGER_AUDITORIA_PROFUNDA]
        
      - LEVEL 4 (Subcontractors/Workers): If the user asks about the workers, "quem colocou a mão na massa", or tier-3 subcontractors:
        Tag: [UI_TRIGGER_SUBCONTRATADOS]
        
      - LEVEL 5 (Cross-reference/Taxes): If the user asks about tax mismatch, "Receita Federal", off-chain data, or suspicious invoices:
        Tag: [UI_TRIGGER_CRUZAMENTO_RECEITA]
        
      - LEVEL 6 (Forensic Fraud/Slashing): If the user asks about confirmed fraud, "lavagem de dinheiro", "laranjas", or triggering the DAO Slashing:
        Tag: [UI_TRIGGER_FRAUDE]

      RULES:
      1. Always respond in Portuguese (PT-BR).
      2. Keep responses professional, analytical, and concise. Use Markdown for readability.
      3. Do NOT explain the tags to the user. Just output them silently at the end of the text.
      4. Se o usuário pedir 'Forneça a árvore completa' ou 'Mostrar toda a rastreabilidade', você deve responder com uma breve explicação e incluir a tag exata: [UI_TRIGGER_ARVORE_COMPLETA].
    `;

    // Formata o histórico do frontend para o formato do novo SDK
    const formattedContents = messages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Chamada simplificada e poderosa do novo SDK
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: formattedContents,
      config: {
        systemInstruction: systemPrompt,
        // Opcional: temperature: 0.2 (para manter a IA mais analítica e factual)
      }
    });

    const text = response.text || "Sem resposta gerada.";

    return NextResponse.json({ reply: text });

  } catch (error) {
    console.error("Erro na API do Gemini:", error);
    return NextResponse.json(
      { reply: "Erro de conexão com o oráculo de IA. Verifique sua chave de API ou conexão." }, 
      { status: 500 }
    );
  }
}