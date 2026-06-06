"use client";

import { useState, useEffect } from "react";
import GovLedgerABI from "../../abi/GovLedger.json";
import { createPublicClient, http, formatEther } from "viem";
import { hardhat } from "viem/chains";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { Activity, ShieldAlert, CheckCircle, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";

const CONTRATO_ENDERECO = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Atualize se necessário

export default function DashboardTransparencia() {
  const router = useRouter();
  const [metricas, setMetricas] = useState({ totalPago: 0, obrasPendentes: 0, riscoDetetado: 0 });
  const [dadosGrafico, setDadosGrafico] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const carregarDadosAgregados = async () => {
      try {
        const publicClient = createPublicClient({ chain: hardhat, transport: http("http://127.0.0.1:8545") });
        const total = await publicClient.readContract({
          address: CONTRATO_ENDERECO,
          abi: GovLedgerABI.abi,
          functionName: "totalMedicoes",
        }) as bigint;

        let pago = 0;
        let pendentes = 0;
        const agruparPorEdital: Record<string, number> = {};

        for (let i = 1; i <= Number(total); i++) {
          const m = await publicClient.readContract({
            address: CONTRATO_ENDERECO,
            abi: GovLedgerABI.abi,
            functionName: "medicoes",
            args: [i],
          }) as any[];

          const valor = Number(formatEther(m[4]));
          const edital = m[1];
          const aprovado = m[6];

          if (aprovado) pago += valor;
          else pendentes++;

          if (!agruparPorEdital[edital]) agruparPorEdital[edital] = 0;
          agruparPorEdital[edital] += valor;
        }

        const chartData = Object.keys(agruparPorEdital).map(key => ({
          edital: key,
          valor: agruparPorEdital[key]
        }));

        setMetricas({ totalPago: pago, obrasPendentes: pendentes, riscoDetetado: 2 }); // Mock de risco para o design
        setDadosGrafico(chartData);
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    carregarDadosAgregados();
  }, []);

  return (
    <main className="min-h-screen p-10 bg-black text-zinc-50 flex flex-col items-center">
      <div className="w-full max-w-6xl">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-10 border-b border-zinc-900 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Transparência e Analytics</h1>
            <p className="text-zinc-500 mt-1">Visão global de execução orçamental e monitorização de anomalias.</p>
          </div>
          <button onClick={() => router.push("/auditoria")} className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition text-sm">
            Voltar à Auditoria
          </button>
        </div>

        {isLoading ? (
          <div className="w-full h-64 flex items-center justify-center text-zinc-600 animate-pulse">A compilar dados da blockchain...</div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
              <div className="p-6 bg-[#0a0a0a] border border-zinc-900 rounded-xl">
                <div className="flex items-center gap-3 mb-2 text-emerald-500"><Wallet size={20} /> <span className="text-sm font-medium">Orçamento Executado</span></div>
                <div className="text-3xl font-bold font-mono">{metricas.totalPago} ETH</div>
              </div>
              <div className="p-6 bg-[#0a0a0a] border border-zinc-900 rounded-xl">
                <div className="flex items-center gap-3 mb-2 text-amber-500"><Activity size={20} /> <span className="text-sm font-medium">Fases Pendentes</span></div>
                <div className="text-3xl font-bold">{metricas.obrasPendentes}</div>
              </div>
              <div className="p-6 bg-[#0a0a0a] border border-zinc-900 rounded-xl">
                <div className="flex items-center gap-3 mb-2 text-purple-500"><CheckCircle size={20} /> <span className="text-sm font-medium">Auditorias IA Concluídas</span></div>
                <div className="text-3xl font-bold">100%</div>
              </div>
              <div className="p-6 bg-[#0a0a0a] border border-rose-900/30 rounded-xl">
                <div className="flex items-center gap-3 mb-2 text-rose-500"><ShieldAlert size={20} /> <span className="text-sm font-medium">Alertas de Fraude (RL)</span></div>
                <div className="text-3xl font-bold">{metricas.riscoDetetado}</div>
              </div>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-[#0a0a0a] border border-zinc-900 rounded-xl">
                <h3 className="text-lg font-medium text-zinc-300 mb-6">Alocação por Edital (ETH)</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dadosGrafico}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                      <XAxis dataKey="edital" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}Ξ`} />
                      <Tooltip cursor={{fill: '#18181b'}} contentStyle={{ backgroundColor: '#000', borderColor: '#27272a', color: '#fff' }} />
                      <Bar dataKey="valor" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-6 bg-[#0a0a0a] border border-zinc-900 rounded-xl flex flex-col justify-center items-center text-center">
                 <ShieldAlert size={48} className="text-zinc-800 mb-4" />
                 <h3 className="text-lg font-medium text-zinc-300 mb-2">Motor de Reinforcement Learning</h3>
                 <p className="text-sm text-zinc-500 max-w-sm">
                   O painel de vetores de estado e recompensas do agente adaptativo será acoplado a este módulo na próxima fase de integração.
                 </p>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}