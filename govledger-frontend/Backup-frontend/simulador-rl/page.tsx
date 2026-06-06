"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrainCircuit, ShieldAlert, ShieldCheck, Activity, Zap, AlertTriangle } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";

interface Historico {
  tentativa: number;
  score: number;
  acaoAgente: string;
}

export default function SimuladorRL() {
  const router = useRouter();
  
  // Estado do Agente (Simulação de Q-Learning)
  const [riscoConstrutora, setRiscoConstrutora] = useState(20); // Começa com 20% de risco (estado inicial)
  const [tentativas, setTentativas] = useState(0);
  const [historicoEvolucao, setHistoricoEvolucao] = useState<Historico[]>([{ tentativa: 0, score: 20, acaoAgente: "Monitorização Inicial" }]);

  // Função de Recompensa/Penalização do Agente
  const simularSubmissao = (tipo: "valida" | "fraude") => {
    let novoRisco = riscoConstrutora;
    let acao = "";
    const novaTentativa = tentativas + 1;

    if (tipo === "fraude") {
      // Penalização severa: Aumenta o risco exponencialmente
      novoRisco = Math.min(novoRisco + 35, 100);
      acao = novoRisco >= 80 ? "Bloqueio Preventivo Ativado" : "Alerta de Inconsistência";
    } else {
      // Recompensa: Reduz o risco gradualmente (ganhar confiança demora mais do que perdê-la)
      novoRisco = Math.max(novoRisco - 15, 0);
      acao = novoRisco <= 30 ? "Aprovação Automática" : "Aprovação com Observação";
    }

    setRiscoConstrutora(novoRisco);
    setTentativas(novaTentativa);
    setHistoricoEvolucao([...historicoEvolucao, { tentativa: novaTentativa, score: novoRisco, acaoAgente: acao }]);
  };

  const resetarSimulacao = () => {
    setRiscoConstrutora(20);
    setTentativas(0);
    setHistoricoEvolucao([{ tentativa: 0, score: 20, acaoAgente: "Monitorização Inicial" }]);
  };

  return (
    <main className="min-h-screen p-10 bg-black text-zinc-50 flex flex-col items-center">
      <div className="w-full max-w-5xl">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-10 border-b border-zinc-900 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-900/30 text-purple-500 rounded-lg border border-purple-900/50">
              <BrainCircuit size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Motor Antifraude Adaptativo</h1>
              <p className="text-zinc-500 mt-1">Simulação do Agente de Reinforcement Learning em tempo real.</p>
            </div>
          </div>
          <button onClick={() => router.push("/dashboard")} className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition text-sm">
            Voltar ao Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Painel de Controlo da Simulação (Ações) */}
          <div className="md:col-span-1 flex flex-col gap-4">
            <div className="p-6 bg-[#0a0a0a] border border-zinc-900 rounded-xl">
              <h3 className="text-lg font-medium text-zinc-300 mb-4 flex items-center gap-2">
                <Activity size={18} /> Injetar Dados (State)
              </h3>
              <p className="text-sm text-zinc-500 mb-6">
                Simule submissões da "Construtora Alpha" para treinar a política do agente.
              </p>
              
              <button 
                onClick={() => simularSubmissao("valida")}
                disabled={riscoConstrutora >= 90}
                className="w-full mb-3 px-4 py-3 bg-emerald-900/20 hover:bg-emerald-900/40 text-emerald-500 border border-emerald-900/50 rounded-lg transition text-sm font-bold flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShieldCheck size={18} /> Simular Laudo Válido (Reward +)
              </button>
              
              <button 
                onClick={() => simularSubmissao("fraude")}
                disabled={riscoConstrutora >= 100}
                className="w-full px-4 py-3 bg-rose-900/20 hover:bg-rose-900/40 text-rose-500 border border-rose-900/50 rounded-lg transition text-sm font-bold flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <AlertTriangle size={18} /> Simular Anomalia (Penalty -)
              </button>

              <button onClick={resetarSimulacao} className="w-full mt-6 text-xs text-zinc-600 hover:text-zinc-400 transition underline">
                Reiniciar Pesos do Modelo
              </button>
            </div>
          </div>

          {/* Painel de Visualização do Agente (Gráfico e Status) */}
          <div className="md:col-span-2 flex flex-col gap-6">
            
            {/* Status em Tempo Real */}
            <div className={`p-6 border rounded-xl flex items-center gap-6 transition-all duration-500 ${
              riscoConstrutora >= 80 ? "bg-rose-950/20 border-rose-900/50" : 
              riscoConstrutora <= 30 ? "bg-emerald-950/20 border-emerald-900/50" : 
              "bg-[#0a0a0a] border-zinc-900"
            }`}>
              <div className="flex-1">
                <div className="text-sm font-medium text-zinc-400 mb-1">Decisão do Agente (Action)</div>
                <div className={`text-2xl font-bold ${
                  riscoConstrutora >= 80 ? "text-rose-500" : 
                  riscoConstrutora <= 30 ? "text-emerald-500" : "text-amber-500"
                }`}>
                  {historicoEvolucao[historicoEvolucao.length - 1].acaoAgente}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-zinc-400 mb-1">Score de Risco Atual</div>
                <div className="text-4xl font-mono font-bold text-white">{riscoConstrutora}%</div>
              </div>
            </div>

            {/* Gráfico de Evolução */}
            <div className="p-6 bg-[#0a0a0a] border border-zinc-900 rounded-xl flex-1 min-h-[300px]">
              <h3 className="text-lg font-medium text-zinc-300 mb-6 flex items-center gap-2">
                <Zap size={18} /> Curva de Aprendizagem da Confiança
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historicoEvolucao}>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#000', borderColor: '#27272a', color: '#fff' }}
                      labelFormatter={(label) => `Submissão #${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke={riscoConstrutora >= 80 ? "#f43f5e" : "#8b5cf6"} 
                      strokeWidth={3} 
                      dot={{ r: 6, fill: '#000', strokeWidth: 2 }} 
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}