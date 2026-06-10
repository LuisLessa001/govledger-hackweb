'use client';

import { useState, useEffect } from 'react';
import { Activity, ShieldAlert, Gavel, Network, CheckCircle, AlertTriangle, Lock, Link as LinkIcon, Cpu } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import toast, { Toaster } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

// Interfaces de tipagem
interface PedidoAvaliacao {
  empresa: string;
  numero_edital: string;
  valor_solicitado: number;
  obras_concluidas: number;
  atrasos_anteriores: number;
}

interface RespostaAvaliacao {
  score_risco: number;
  aprovado_ia: boolean;
  q_value_calculado: number;
  mensagem: string;
}

interface CasoDAO {
  id: string;
  empresa: string;
  acusacao: string;
  votosContra: number;
  votosFavor: number;
}

export default function GovLedgerSPA() {
  // Estado de Navegação SPA
  const [abaAtiva, setAbaAtiva] = useState<'construtora' | 'tribunal' | 'transparencia'>('construtora');
  
  // Estado do Motor Rust & Formulário
  const [loadingRust, setLoadingRust] = useState(false);
  const [resultadoIA, setResultadoIA] = useState<RespostaAvaliacao | null>(null);
  const [form, setForm] = useState({ empresa: 'Odebrecht S.A.', edital: 'BR-101-2026', valor: 500000, obras: 3, atrasos: 1 });

  // Estados dos Oráculos e Rede (Bento Box)
  const [oraclePrice, setOraclePrice] = useState(5847.32);
  const [oracleDelta, setOracleDelta] = useState(0.0);
  const [networkIPFS, setNetworkIPFS] = useState(12);
  const [networkRPC, setNetworkRPC] = useState(8);

  // Estados do Tribunal DAO
  const [casosDAO, setCasosDAO] = useState<CasoDAO[]>([
    { id: 'TX-992', empresa: 'Construtora Alfa', acusacao: 'Material fora da especificação (Cimento CP-II)', votosContra: 142, votosFavor: 12 },
    { id: 'TX-814', empresa: 'Engenharia Beta', acusacao: 'Desvio de verba trabalhista', votosContra: 89, votosFavor: 45 },
    { id: 'TX-105', empresa: 'Gama Obras', acusacao: 'Atraso injustificado (Fase 2)', votosContra: 210, votosFavor: 5 }
  ]);
  const [votosRegistrados, setVotosRegistrados] = useState<Set<string>>(new Set());

  // Estados do MetaMask (Assinatura Web3)
  const [modalMetaMask, setModalMetaMask] = useState<'idle' | 'confirming' | 'generating' | 'done'>('idle');
  const [txHash, setTxHash] = useState('');

  // Efeito 1: Oráculo de Preço Chainlink (Evita memory leak com clearInterval)
  useEffect(() => {
    const interval = setInterval(() => {
      setOraclePrice(prev => {
        const change = prev * (Math.random() * 0.01 - 0.005);
        setOracleDelta(change);
        return prev + change;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Efeito 2: Latência de Rede IPFS/RPC
  useEffect(() => {
    const interval = setInterval(() => {
      setNetworkIPFS(Math.floor(Math.random() * 40) + 5);
      setNetworkRPC(Math.floor(Math.random() * 15) + 2);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Efeito 3: Simulação de Votos na DAO
  useEffect(() => {
    const interval = setInterval(() => {
      setCasosDAO(prev => prev.map(caso => 
        Math.random() > 0.5 
          ? { ...caso, votosContra: caso.votosContra + Math.floor(Math.random() * 3) }
          : caso
      ));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Helper para dados do Radar Chart
  const getRadarData = () => {
    const pontualidade = Math.max(10, 100 - (form.atrasos * 15));
    const historico = Math.min(100, form.obras * 20);
    const scoreIA = resultadoIA ? resultadoIA.score_risco : 50;
    return [
      { metric: 'Pontualidade', value: pontualidade },
      { metric: 'Histórico', value: historico },
      { metric: 'Compliance', value: form.atrasos > 0 ? 40 : 90 },
      { metric: 'Solvência', value: form.valor > 1000000 ? 60 : 95 },
      { metric: 'Score IA', value: scoreIA }
    ];
  };

  // Comunicação com o Back-end Rust
  const invocarCerebroRust = async () => {
    setLoadingRust(true);
    setResultadoIA(null);
    try {
      const payload: PedidoAvaliacao = {
        empresa: form.empresa,
        numero_edital: form.edital,
        valor_solicitado: form.valor,
        obras_concluidas: form.obras,
        atrasos_anteriores: form.atrasos
      };
      const response = await fetch('http://127.0.0.1:8080/api/avaliar-risco', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      setResultadoIA(data);
      toast.success('Matriz de risco processada pelo Q-Learning');
    } catch (error) {
      console.error("Falha na ponte HTTP com o Rust:", error);
      toast.error('Erro de conexão com o oráculo Rust');
    }
    setLoadingRust(false);
  };

  return (
    <div className="min-h-screen bg-black text-gray-200 font-mono p-6 lg:p-10 selection:bg-cyan-900 selection:text-white">
      <Toaster position="top-right" toastOptions={{ style: { background: '#050505', color: '#fff', border: '1px solid #262626' } }} />
      
      {/* Header Corporativo */}
      <header className="mb-8 border-b border-neutral-900 pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter text-white flex items-center gap-2">
            <ShieldAlert className="text-cyan-500" size={32} /> GovLedger
          </h1>
          <p className="text-xs text-neutral-500 mt-2 uppercase tracking-widest">
            Equipe: <span className="text-cyan-600">TrustNode</span> | HackWeb 2026
          </p>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-2 bg-[#050505] px-3 py-1 border border-neutral-900">
            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-neutral-400">Rust Core</span>
          </div>
          <div className="flex items-center space-x-2 bg-[#050505] px-3 py-1 border border-neutral-900">
            <div className="h-2 w-2 bg-cyan-500 rounded-full animate-pulse"></div>
            <span className="text-neutral-400">Web3 Core</span>
          </div>
        </div>
      </header>

      {/* Navegação SPA */}
      <div className="flex space-x-1 mb-8 border-b border-neutral-900">
        {[
          { id: 'construtora', label: '1. Portal da Construtora', icon: Activity },
          { id: 'tribunal', label: '2. Tribunal Cidadão (DAO)', icon: Gavel },
          { id: 'transparencia', label: '3. Cofre & Vesting', icon: Network }
        ].map((aba) => {
          const Icon = aba.icon;
          return (
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id as any)}
              className={`flex items-center gap-2 px-6 py-3 text-xs uppercase font-bold tracking-widest transition-all ${
                abaAtiva === aba.id 
                  ? 'bg-neutral-900 text-white border-t-2 border-cyan-500' 
                  : 'text-neutral-600 hover:text-white hover:bg-[#050505]'
              }`}
            >
              <Icon size={16} /> {aba.label}
            </button>
          );
        })}
      </div>

      <main className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
{/* Segunda parte logo abaixo */}

{/* Aba 1: Construtora (Padrão Bento Box) */}
          {abaAtiva === 'construtora' && (
            <div className="animate-fade-in flex flex-col gap-6">
              
              {/* Formulário Principal */}
              <div className="bg-[#050505] border border-neutral-900 p-6">
                <h2 className="text-sm font-bold text-neutral-400 mb-4 uppercase tracking-widest border-b border-neutral-900 pb-3 flex items-center gap-2">
                  <Activity size={16} className="text-cyan-500" />
                  Submissão de Laudo e Risco
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                  <div className="flex flex-col space-y-2">
                    <label className="text-[10px] text-neutral-500 uppercase tracking-widest">Empresa Contratada</label>
                    <input type="text" value={form.empresa} onChange={e => setForm({...form, empresa: e.target.value})} className="bg-black border border-neutral-800 p-2.5 text-xs focus:border-cyan-500 outline-none transition-colors text-white" />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="text-[10px] text-neutral-500 uppercase tracking-widest">Número do Edital</label>
                    <input type="text" value={form.edital} onChange={e => setForm({...form, edital: e.target.value})} className="bg-black border border-neutral-800 p-2.5 text-xs focus:border-cyan-500 outline-none transition-colors text-white" />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="text-[10px] text-neutral-500 uppercase tracking-widest">Orçamento Solicitado (Fiat)</label>
                    <input type="number" value={form.valor} onChange={e => setForm({...form, valor: Number(e.target.value)})} className="bg-black border border-neutral-800 p-2.5 text-xs focus:border-cyan-500 outline-none transition-colors text-white" />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="text-[10px] text-neutral-500 uppercase tracking-widest">Histórico (Obras / Atrasos)</label>
                    <div className="flex space-x-2">
                      <input type="number" value={form.obras} onChange={e => setForm({...form, obras: Number(e.target.value)})} className="bg-black border border-neutral-800 p-2.5 text-xs w-1/2 focus:border-emerald-500 outline-none transition-colors text-emerald-400" />
                      <input type="number" value={form.atrasos} onChange={e => setForm({...form, atrasos: Number(e.target.value)})} className="bg-black border border-neutral-800 p-2.5 text-xs w-1/2 focus:border-red-500 outline-none transition-colors text-red-400" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={invocarCerebroRust} disabled={loadingRust} className="flex-1 bg-cyan-950/30 hover:bg-cyan-900/50 text-cyan-400 px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors border border-cyan-900/50 disabled:opacity-50 flex items-center justify-center gap-2">
                    <Cpu size={16} /> {loadingRust ? 'Calculando Tensor...' : '1. Invocar IA (Rust)'}
                  </button>
                  <button 
                    disabled={!resultadoIA?.aprovado_ia} 
                    onClick={() => setModalMetaMask('confirming')}
                    className="flex-1 bg-[#050505] hover:bg-neutral-900 text-neutral-300 px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors border border-neutral-800 disabled:opacity-30 flex items-center justify-center gap-2"
                  >
                    <Lock size={16} /> 2. Assinar Web3
                  </button>
                </div>
              </div>

              {/* Grid Bento Inferior */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Widget 1: Oráculo Chainlink Simulado */}
                <div className="bg-[#050505] border border-neutral-900 p-5 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-1"><LinkIcon size={12} /> Oráculo de Preço</span>
                    <span className="text-[10px] text-cyan-600 bg-cyan-950/30 px-2 py-0.5 rounded-full">ETH/BRL</span>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white flex items-baseline gap-2">
                      R$ {oraclePrice.toFixed(2)}
                      <span className={`text-xs ${oracleDelta >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {oracleDelta >= 0 ? '▲' : '▼'} {Math.abs(oracleDelta).toFixed(2)}%
                      </span>
                    </div>
                    <div className="text-[10px] text-neutral-600 mt-1">Status: Sincronizado</div>
                  </div>
                </div>

                {/* Widget 2: Latência de Rede */}
                <div className="bg-[#050505] border border-neutral-900 p-5 flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-1"><Network size={12} /> Saúde da Rede</span>
                    <span className="flex gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                      <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] text-neutral-500">IPFS Gateway</div>
                      <div className={`text-lg font-bold ${networkIPFS < 20 ? 'text-emerald-400' : 'text-amber-400'}`}>{networkIPFS} ms</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-500">Foundry RPC</div>
                      <div className={`text-lg font-bold ${networkRPC < 10 ? 'text-cyan-400' : 'text-amber-400'}`}>{networkRPC} ms</div>
                    </div>
                  </div>
                </div>

                {/* Gráfico Radar de Perfil de Risco (Recharts) */}
                <div className="bg-[#050505] border border-neutral-900 p-5 md:col-span-2 h-72 flex flex-col">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Activity size={12} /> Matriz de Perfil Dinâmico
                  </span>
                  <div className="flex-1 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={getRadarData()}>
                        <PolarGrid stroke="#262626" />
                        <PolarAngleAxis dataKey="metric" tick={{ fill: '#737373', fontSize: 10 }} />
                        <Radar name="Risco" dataKey="value" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} />
                        <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#262626', fontSize: '12px' }} itemStyle={{ color: '#06b6d4' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                    {/* Overlay de status bloqueio/liberação */}
                    {resultadoIA && (
                      <div className="absolute top-0 right-0">
                        {resultadoIA.aprovado_ia ? (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-500 bg-emerald-950/30 px-2 py-1 border border-emerald-900/50"><CheckCircle size={12} /> Assinatura Liberada</span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] text-red-500 bg-red-950/30 px-2 py-1 border border-red-900/50"><AlertTriangle size={12} /> Bloqueio de Risco</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

{/* Terceira parte logo abaixo */}

{/* Aba 2: Tribunal Cidadão (DAO) */}
          {abaAtiva === 'tribunal' && (
            <div className="animate-fade-in flex flex-col gap-6">
              <div className="bg-[#050505] border border-neutral-900 p-6">
                <h2 className="text-sm font-bold text-neutral-400 mb-6 uppercase tracking-widest border-b border-neutral-900 pb-3 flex items-center gap-2">
                  <Gavel size={16} className="text-purple-500" />
                  Casos em Julgamento Ativo
                </h2>
                
                <div className="space-y-6">
                  {casosDAO.map((caso) => {
                    const totalVotos = caso.votosContra + caso.votosFavor;
                    const pctContra = totalVotos === 0 ? 0 : (caso.votosContra / totalVotos) * 100;
                    const pctFavor = totalVotos === 0 ? 0 : (caso.votosFavor / totalVotos) * 100;
                    const jaVotou = votosRegistrados.has(caso.id);

                    return (
                      <div key={caso.id} className="bg-black border border-neutral-800 p-4 transition-all hover:border-neutral-700">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-purple-500 bg-purple-950/30 px-2 py-0.5 border border-purple-900/30">{caso.id}</span>
                              <span className="text-sm font-bold text-white">{caso.empresa}</span>
                            </div>
                            <p className="text-xs text-neutral-500 mt-1 uppercase tracking-widest">{caso.acusacao}</p>
                          </div>
                          
                          {/* Botão de Votação On-Chain */}
                          <button 
                            disabled={jaVotou}
                            onClick={() => {
                              setVotosRegistrados(new Set(votosRegistrados).add(caso.id));
                              toast.success(`Voto registrado on-chain para o caso ${caso.id}`);
                            }}
                            className="bg-purple-950/30 hover:bg-purple-900/50 text-purple-400 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors border border-purple-900/50 disabled:opacity-30 disabled:hover:bg-purple-950/30 flex items-center gap-1"
                          >
                            <ShieldAlert size={12} /> {jaVotou ? 'Voto Registrado' : 'Assinar Voto'}
                          </button>
                        </div>

                        {/* Barras de Progresso Dinâmicas */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest">
                            <span className="text-red-400">Penalizar (Slashing) - {caso.votosContra}</span>
                            <span className="text-emerald-400">Inocentar - {caso.votosFavor}</span>
                          </div>
                          <div className="w-full h-1.5 flex bg-neutral-900">
                            <div style={{ width: `${pctContra}%` }} className="h-full bg-red-500/80 transition-all duration-500"></div>
                            <div style={{ width: `${pctFavor}%` }} className="h-full bg-emerald-500/80 transition-all duration-500"></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Aba 3: Transparência e Vesting */}
          {abaAtiva === 'transparencia' && (
            <div className="animate-fade-in flex flex-col gap-6">
              
              {/* Gráfico de Retenção (Vesting) */}
              <div className="bg-[#050505] border border-neutral-900 p-6 h-72 flex flex-col">
                <h2 className="text-sm font-bold text-neutral-400 mb-4 uppercase tracking-widest border-b border-neutral-900 pb-3 flex items-center gap-2">
                  <Network size={16} className="text-amber-500" />
                  Cronograma de Liberação de Garantia (SLA 365 Dias)
                </h2>
                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { mes: 'Início', saldo: 100 }, { mes: 'Trimestre 1', saldo: 100 },
                      { mes: 'Trimestre 2', saldo: 100 }, { mes: 'Trimestre 3', saldo: 100 },
                      { mes: '1 Ano', saldo: 0 } // Desbloqueio no final do período
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                      <XAxis dataKey="mes" tick={{ fill: '#737373', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#737373', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                      <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#262626', fontSize: '12px' }} itemStyle={{ color: '#f59e0b' }} />
                      <Area type="stepAfter" dataKey="saldo" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Árvore de Rastreabilidade "Follow the Money" */}
              <div className="bg-[#050505] border border-neutral-900 p-6">
                <h2 className="text-sm font-bold text-neutral-400 mb-6 uppercase tracking-widest border-b border-neutral-900 pb-3 flex items-center gap-2">
                  <LinkIcon size={16} className="text-blue-500" />
                  Rastreabilidade de Suprimentos (GovLedgerCore)
                </h2>
                
                <div className="flex flex-col items-center">
                  {/* Tesouro Base */}
                  <div className="bg-black border border-blue-900 p-3 text-center w-56 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                    <div className="text-[10px] text-blue-500 uppercase tracking-widest font-bold mb-1">Cofre do Tesouro</div>
                    <div className="text-sm font-bold text-white">100% (Orçamento ETH)</div>
                  </div>
                  
                  {/* Conectores Visuais */}
                  <div className="h-6 w-px bg-neutral-800"></div>
                  <div className="w-full max-w-sm h-px bg-neutral-800"></div>
                  
                  {/* Divisão: Escrow vs Fornecedores */}
                  <div className="flex justify-between w-full max-w-sm mt-0">
                    <div className="flex flex-col items-center">
                      <div className="h-6 w-px bg-neutral-800"></div>
                      <div className="bg-black border border-amber-900 p-3 text-center w-36 relative">
                        <Lock size={12} className="absolute -top-2 -right-2 text-amber-500 bg-black rounded-full" />
                        <div className="text-[10px] text-amber-500 uppercase tracking-widest font-bold mb-1">Escrow Vesting</div>
                        <div className="text-xs font-bold text-white">Retenção de 10%</div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <div className="h-6 w-px bg-neutral-800"></div>
                      <div className="bg-black border border-emerald-900 p-3 text-center w-48">
                        <div className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold mb-1 flex justify-center items-center gap-1">
                          <CheckCircle size={10} /> Fornecedores
                        </div>
                        <div className="text-xs font-bold text-white">Roteamento Direto (90%)</div>
                      </div>
                      
                      {/* Sub-divisão Fornecedores */}
                      <div className="h-4 w-px bg-neutral-800"></div>
                      <div className="flex gap-2">
                        <div className="text-[9px] font-bold uppercase tracking-widest border border-neutral-800 bg-neutral-900/50 px-2 py-1 text-neutral-400">Cimenteira (40%)</div>
                        <div className="text-[9px] font-bold uppercase tracking-widest border border-neutral-800 bg-neutral-900/50 px-2 py-1 text-neutral-400">Construtora (50%)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

{/* Quarta parte logo abaixo */}

{/* Terminal do Agente RL (Direita - Fixo) */}
        <div className="bg-black border border-neutral-900 p-6 min-h-[600px] flex flex-col relative overflow-hidden xl:col-span-1">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-900 to-transparent"></div>
          
          <h3 className="text-xs font-bold text-neutral-500 mb-6 uppercase tracking-widest flex justify-between border-b border-neutral-900 pb-4">
            <span className="flex items-center gap-2"><Activity size={14}/> Terminal RL</span>
            <span className="text-cyan-700">Rust Backend</span>
          </h3>
          
          <div className="flex-1 bg-[#020202] border border-neutral-900 p-5 text-[10px] text-neutral-400 overflow-y-auto font-mono">
            {!resultadoIA && !loadingRust && (
              <p className="animate-pulse text-neutral-600">&gt; Agente Q-Learning ocioso. Aguardando payload na porta 8080...</p>
            )}

            {loadingRust && (
              <p className="text-cyan-600 flex items-center gap-2">
                <span className="h-2 w-2 bg-cyan-500 rounded-full animate-ping"></span>
                &gt; Processando matriz de recompensa (Bellman Equation)...
              </p>
            )}
            
            {resultadoIA && !loadingRust && (
              <div className="animate-fade-in space-y-3">
                <p className="text-cyan-500 font-bold">&gt; HTTP 200 OK: Payload processado.</p>
                <p>&gt; Alvo da inferência: <span className="text-white">{form.empresa}</span></p>
                <p>&gt; Histórico extraído: {form.obras} Sucessos | {form.atrasos} Multas</p>
                <p>&gt; Executando Equação de Bellman...</p>
                <p>&gt; Q-Value Convergido: <span className="text-white font-bold">{resultadoIA.q_value_calculado.toFixed(2)}</span></p>
                
                <div className="my-6 border-t border-neutral-900 pt-6">
                  <p className="mb-3 text-neutral-500">VEREDICTO DA IA:</p>
                  
                  <div className="flex justify-between items-center bg-black border border-neutral-800 p-4 mb-3">
                    <span>Score de Risco</span>
                    <span className={`text-lg font-bold ${resultadoIA.aprovado_ia ? 'text-emerald-500' : 'text-red-500'}`}>
                      {resultadoIA.score_risco}/100
                    </span>
                  </div>
                  
                  {resultadoIA.aprovado_ia ? (
                    <div className="p-3 border border-emerald-900/50 text-emerald-500 bg-emerald-950/10 text-center font-bold tracking-widest uppercase flex flex-col items-center gap-2">
                      <CheckCircle size={16} /> Acesso Liberado
                    </div>
                  ) : (
                    <div className="p-3 border border-red-900/50 text-red-500 bg-red-950/10 text-center font-bold tracking-widest uppercase flex flex-col items-center gap-2">
                      <AlertTriangle size={16} /> Risco Estrutural Detetado
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal Web3 (MetaMask Simulado) */}
      {modalMetaMask !== 'idle' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#050505] border border-neutral-800 w-full max-w-sm p-6 shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center mb-6 border-b border-neutral-900 pb-4">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                <Lock size={14} className="text-amber-500" /> Web3 Provider
              </span>
              <button onClick={() => setModalMetaMask('idle')} className="text-neutral-600 hover:text-white transition-colors">&times;</button>
            </div>

            {/* Passo 1: Confirmação */}
            {modalMetaMask === 'confirming' && (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-white font-bold text-sm">Assinar Transação</h3>
                  <p className="text-[10px] text-neutral-500">Contrato: GovLedgerCore.sol</p>
                </div>
                <div className="bg-black border border-neutral-900 p-4 text-xs space-y-3">
                  <div className="flex justify-between border-b border-neutral-900 pb-2"><span className="text-neutral-500">Método</span><span className="text-cyan-400 font-bold">liberarVesting()</span></div>
                  <div className="flex justify-between border-b border-neutral-900 pb-2"><span className="text-neutral-500">Destino</span><span className="text-white truncate max-w-[120px]">0x7fB...9aD</span></div>
                  <div className="flex justify-between"><span className="text-neutral-500">Taxa Estimada</span><span className="text-white">0.0014 ETH</span></div>
                </div>
                <button 
                  onClick={() => {
                    setModalMetaMask('generating');
                    // Simulação do tempo de mineração do bloco
                    setTimeout(() => {
                      const fakeHash = '0x' + Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('');
                      setTxHash(fakeHash);
                      setModalMetaMask('done');
                      toast.success('Transação minerada na rede!');
                    }, 2500);
                  }}
                  className="w-full bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-400 font-bold uppercase tracking-widest py-3 text-[10px] border border-cyan-900 transition-all flex justify-center items-center gap-2"
                >
                  <Cpu size={14} /> Confirmar Assinatura
                </button>
              </div>
            )}

            {/* Passo 2: Processando Transação */}
            {modalMetaMask === 'generating' && (
              <div className="flex flex-col items-center justify-center py-10 space-y-6">
                <div className="h-10 w-10 border-2 border-neutral-800 border-t-cyan-500 rounded-full animate-spin"></div>
                <div className="text-center space-y-1">
                  <p className="text-xs text-neutral-300 font-bold uppercase tracking-widest">Aguardando Rede</p>
                  <p className="text-[10px] text-neutral-600">Minerando bloco no Foundry Localnet...</p>
                </div>
              </div>
            )}

            {/* Passo 3: Concluído */}
            {modalMetaMask === 'done' && (
              <div className="text-center space-y-6">
                <CheckCircle size={48} className="mx-auto text-emerald-500 animate-fade-in" />
                <div>
                  <h3 className="text-emerald-500 font-bold uppercase tracking-widest text-sm mb-3">Escrow Liberado</h3>
                  <div className="bg-black border border-neutral-900 p-3 text-[10px] text-neutral-500 break-all font-mono">
                    {txHash}
                  </div>
                </div>
                <button onClick={() => setModalMetaMask('idle')} className="w-full bg-[#050505] hover:bg-neutral-900 text-white font-bold uppercase tracking-widest py-3 text-[10px] transition-all border border-neutral-800">
                  Fechar Terminal
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}