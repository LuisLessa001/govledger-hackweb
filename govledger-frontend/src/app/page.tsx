'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Activity, ShieldAlert, Gavel, Network, CheckCircle, 
  AlertTriangle, Lock, Link as LinkIcon, Cpu, Send, Bot, 
  ChevronDown, ChevronUp, FileText, ChevronRight,
  Layers, Box, Home, Database
} from 'lucide-react';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, Radar, 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import toast, { Toaster } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

// --- Interfaces ---
interface PedidoAvaliacao {
  empresa: string;
  numero_edital: string;
  valor_solicitado: number;
  obras_concluidas: number;
  atrasos_anteriores: number;
  valor_staking: number;
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

type ChatMessage = { 
  role: 'user' | 'assistant'; 
  content: string;
};

export default function GovLedgerSPA() {
  // --- Estados Principais ---
  const [abaAtiva, setAbaAtiva] = useState<'construtora' | 'tribunal' | 'transparencia'>('construtora');
  
  // --- Estados: Motor Rust & Formulário (Aba 1) ---
  const [loadingRust, setLoadingRust] = useState(false);
  const [resultadoIA, setResultadoIA] = useState<RespostaAvaliacao | null>(null);
  // ---> COLE O CÓDIGO DO TERMINAL EXATAMENTE AQUI <---
  const [terminalLogs, setLogsTerminal] = useState<string[]>([
    "> Inicializando Motor Q-Learning (Rust)...",
    "> Aguardando submissão de parâmetros na EVM..."
  ]);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Função para injetar logs com timestamp
  const addLog = (msg: string) => {
    setLogsTerminal(prev => [...prev, `[${new Date().toLocaleTimeString('pt-BR', { hour12: false })}] ${msg}`]);
  };

  // Efeito para auto-scroll do terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLogs]);
  // ----------------------------------------------------



  const [form, setForm] = useState({ 
    empresa: 'Odebrecht', 
    obras: 12, 
    atrasos: 2,
    valor_solicitado: 1000000,
    valor_staking: 0,
    numero_edital: '001/2026'
  });
  const [modalMetaMask, setModalMetaMask] = useState<'idle' | 'confirming' | 'generating' | 'done'>('idle');
  const [txHash, setTxHash] = useState('');

  // --- Estados: Chat & Árvore (Aba 3) ---
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Olá! Sou o Assistente GovLedger. Estou monitorando o Smart Contract e o Agente Rust. O que deseja auditar?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [treeLevel, setTreeLevel] = useState(0); 
  const [showVestingChart, setShowVestingChart] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  
  const [sbtValidado, setSbtValidado] = useState(false);
  const [stakeDepositado, setStakeDepositado] = useState(false);
  
  // --- Estados de Segurança (Pilar 10 e 11) ---
  const [isHalted, setIsHalted] = useState(false);
  const [modalDenuncia, setModalDenuncia] = useState(false);
  const [hashIPFS, setHashIPFS] = useState('');

  // --- Estados da Transparência (NFT Dinâmico & IPFS) ---
  const [faseObraNFT, setFaseObraNFT] = useState<1 | 2 | 3>(1); 
  // 1 = Fundações, 2 = Estrutura, 3 = Acabamentos


  // Auto-scroll sempre que um novo log entra
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);



  // Auto-scroll do Chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // --- Funções: HandleSimularIA ---
  const handleSimularIA = async () => {
    if (isHalted) {
      toast.error("ERRO: Rede paralisada pelo Circuit Breaker!");
      addLog("> [CIRCUIT BREAKER] Tentativa de invocação da IA bloqueada pela trava de emergência.");
      return;
    }
    if (form.valor_staking < form.valor_solicitado * 0.1) {
      toast.error('Staking insuficiente. Caução mínima exigida: 10%.');
      addLog(`[ERRO] Tentativa de submissão sem Skin in the Game. Staking exigido: R$ ${(form.valor_solicitado * 0.1).toLocaleString('pt-BR')}`);
      return;
    }

    setLoadingRust(true);
    setResultadoIA(null);
    toast.loading('Iniciando Motor Off-Chain (Rust)...', { id: 'rust' });

    addLog(`> Gerando Prova ZK-SNARK para selagem dos dados do edital ${form.numero_edital}...`);

    setTimeout(() => {
      addLog(`> Processando Equação de Bellman para a entidade: ${form.empresa}...`);
    }, 1200);

    setTimeout(() => {
      const isAprovado = form.atrasos < 3;
      const scoreCalc = 85 - (form.atrasos * 10) + (form.obras * 2);
      
      setResultadoIA({
        score_risco: isAprovado ? Math.min(scoreCalc, 100) : scoreCalc,
        aprovado_ia: isAprovado,
        q_value_calculado: isAprovado ? 0.92 : 0.15,
        mensagem: isAprovado ? "Risco Aceitável. Autorizado." : "Risco Estrutural Detectado. Bloqueado."
      });
      
      addLog(`> [RESULTADO] Score calculado: ${scoreCalc}/100. Status: ${isAprovado ? 'APROVADO' : 'REJEITADO (Risco Elevado)'}`);
      
      setLoadingRust(false);
      toast.success('Matriz Q-Learning processada.', { id: 'rust' });
    }, 3000);
  };

  
  
  // --- Funções: Assistente IA (Gemini) ---
  const enviarMensagem = async (texto: string = chatInput) => {
    if (!texto.trim() || chatLoading) return;
    
    const novasMsg: ChatMessage[] = [...chatMessages, { role: 'user', content: texto }];
    setChatMessages(novasMsg);
    setChatInput('');
    setChatLoading(true);
    
    try {
      const res = await fetch('/api/chat', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ messages: novasMsg }) 
      });
      
      const data = await res.json();
      let replyText = data.reply || "Erro ao gerar resposta.";

      // Lógica Progressiva da Árvore (6 Níveis de Profundidade)
      if (replyText.includes('[UI_TRIGGER_FORNECEDORES]')) {
        setTreeLevel((prev) => Math.max(prev, 1));
        replyText = replyText.replace(/\[UI_TRIGGER_FORNECEDORES\]/g, '');
      }
      if (replyText.includes('[UI_TRIGGER_DETALHES]')) {
        setTreeLevel((prev) => Math.max(prev, 2));
        replyText = replyText.replace(/\[UI_TRIGGER_DETALHES\]/g, '');
      }
      if (replyText.includes('[UI_TRIGGER_AUDITORIA_PROFUNDA]')) {
        setTreeLevel((prev) => Math.max(prev, 3));
        replyText = replyText.replace(/\[UI_TRIGGER_AUDITORIA_PROFUNDA\]/g, '');
      }
      if (replyText.includes('[UI_TRIGGER_SUBCONTRATOS]')) {
        setTreeLevel((prev) => Math.max(prev, 4));
        replyText = replyText.replace(/\[UI_TRIGGER_SUBCONTRATOS\]/g, '');
      }
      if (replyText.includes('[UI_TRIGGER_NOTAS_FISCAIS]')) {
        setTreeLevel((prev) => Math.max(prev, 5));
        replyText = replyText.replace(/\[UI_TRIGGER_NOTAS_FISCAIS\]/g, '');
      }
      if (replyText.includes('[UI_TRIGGER_OPERARIOS]')) {
        setTreeLevel((prev) => Math.max(prev, 6));
        replyText = replyText.replace(/\[UI_TRIGGER_OPERARIOS\]/g, '');
      }
      if (replyText.includes('[UI_TRIGGER_ARVORE_COMPLETA]')) {
        setTreeLevel(6); // Expande tudo de uma vez
        replyText = replyText.replace(/\[UI_TRIGGER_ARVORE_COMPLETA\]/g, '');
      }

      setChatMessages([...novasMsg, { role: 'assistant', content: replyText.trim() }]);
    } catch (e) {
      console.error("Chat error:", e);
      setChatMessages([...novasMsg, { role: 'assistant', content: 'Erro de conexão com o oráculo de IA.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem();
    }
  };

  // --- Componentes Menores: Dados Fakes ---
  const dadosVesting = [
    { mes: 'M1', liberado: 0 }, { mes: 'M2', liberado: 0 }, { mes: 'M3', liberado: 0 },
    { mes: 'M4', liberado: 2.5 }, { mes: 'M5', liberado: 5 }, { mes: 'M6', liberado: 7.5 },
    { mes: 'M12', liberado: 10 },
  ];

  const casosDAO: CasoDAO[] = [
    { id: 'CASO-001', empresa: 'Odebrecht', acusacao: 'Uso de material subfaturado', votosContra: 840, votosFavor: 120 },
    { id: 'CASO-002', empresa: 'Andrade Gutierrez', acusacao: 'Atraso crônico injustificado', votosContra: 1500, votosFavor: 300 },
  ];

  return (
    <div className="min-h-screen bg-black text-neutral-300 font-sans selection:bg-cyan-900 selection:text-white">
      <Toaster position="top-right" toastOptions={{ style: { background: '#080808', color: '#fff', border: '1px solid #353535' } }} />

      {/* Header */}
      
      <header className="border-b border-[#1A1A1A] bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="text-[#18B6F6]" size={28} />
            <div>
              <h1 className="text-xl font-bold tracking-tight">GovLedger</h1>
              <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest">Trustless State Infrastructure</p>
            </div>
          </div>
          
          {/* COLE O CÓDIGO DO CIRCUIT BREAKER AQUI (Como você enviou) */}
          <div className="flex items-center gap-4">
            {/* Botão Circuit Breaker (Pilar 11) */}
            <button 
              onClick={() => {
                setIsHalted(!isHalted);
                if (!isHalted) {
                  toast.error("CIRCUIT BREAKER ATIVADO! Rede paralisada.");
                  addLog("> [EMERGÊNCIA] Circuit Breaker acionado. Todas as operações suspensas.");
                } else {
                  toast.success("Rede normalizada.");
                  addLog("> [SISTEMA] Circuit Breaker desativado por Multi-Sig. Operações retomadas.");
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded font-bold text-sm transition-all ${
                isHalted 
                  ? 'bg-red-600 text-white animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.5)]' 
                  : 'bg-red-950/30 text-red-500 border border-red-900/50 hover:bg-red-900/50'
              }`}
            >
              <AlertTriangle size={16} />
              {isHalted ? 'REDE PARALISADA' : 'CIRCUIT BREAKER'}
            </button>
            
            {/* Mock da Carteira Conectada */}
            <div className="flex items-center gap-2 bg-[#1A1A1A] px-4 py-2 rounded border border-[#353535]">
              <div className="w-2 h-2 rounded-full bg-[#18B6F6]"></div>
              <span className="text-sm font-mono text-[#18B6F6]">0x8f7b...3c4d</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navegação de Abas */}
      <nav className="flex border-b border-neutral-900 px-8 bg-[#050505]">
        {[
          { id: 'construtora', label: '1. Risco Construtora (IA)', icon: Activity },
          { id: 'tribunal', label: '2. Tribunal DAO (Slashing)', icon: Gavel },
          { id: 'transparencia', label: '3. Cofre, IA & Rastreabilidade', icon: Network },
        ].map((aba) => (
          <button
            key={aba.id}
            onClick={() => setAbaAtiva(aba.id as any)}
            className={`flex items-center gap-2 px-6 py-4 border-b-2 text-sm font-bold uppercase tracking-wider transition-all ${
              abaAtiva === aba.id 
                ? 'border-[#18B6F6] text-white bg-cyan-950/10' 
                : 'border-transparent text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/50'
            }`}
          >
            <aba.icon size={18} />
            {aba.label}
          </button>
        ))}
      </nav>

      
      {/* Container Principal Flexível */}
      <main className="flex flex-col min-h-[calc(100vh-140px)]">
        
        
        {/* Área Dinâmica das Abas (Ocupa o topo flexível) */}
        <div className="flex-1 p-8">
          
{/* A parte 2 continuará a partir daqui, com o conteúdo da Aba 1 (Construtora) e Aba 2 (Tribunal).*/}

{/* Aba 1: Risco Construtora (IA) */}
          {abaAtiva === 'construtora' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              
              {/* Grid de Cartões (Bento Grid) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Cartão de Submissão */}
                <div className="bg-[#080808] border border-[#353535] rounded-xl p-6 shadow-2xl">
                  <div className="flex items-center gap-3 mb-6 border-b border-[#353535] pb-4">
                    <Activity className="text-[#18B6F6]" size={24} />
                    <h2 className="text-base font-bold text-white tracking-wide">Submissão de Laudo e Risco</h2>
                  </div>
                  
                  <div className="space-y-4">
                    {/* INÍCIO DO CÓDIGO QUE VOCÊ COLOU */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1 flex items-center justify-between">
                        Empresa Contratada
                        {form.empresa.length > 2 && (
                          <span className="flex items-center gap-1 text-purple-400 bg-purple-900/20 px-2 py-0.5 rounded text-[10px] font-bold border border-purple-900/50 animate-in fade-in">
                            <Lock size={10} /> SBT Validado (Personhood)
                          </span>
                        )}
                      </label>
                      <input 
                        type="text" 
                        value={form.empresa} 
                        onChange={(e) => setForm({...form, empresa: e.target.value})}
                        className="w-full bg-black border border-[#353535] rounded-lg p-3 text-sm text-white focus:border-[#18B6F6] focus:ring-1 focus:ring-[#18B6F6] outline-none transition-all"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-neutral-300 mb-1">Valor Solicitado (R$)</label>
                        <input 
                          type="number" 
                          value={form.valor_solicitado} 
                          onChange={(e) => setForm({...form, valor_solicitado: Number(e.target.value)})}
                          className="w-full bg-black border border-[#353535] rounded-lg p-3 text-sm text-white focus:border-[#18B6F6] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-amber-500 mb-1 flex items-center gap-1">
                          <ShieldAlert size={12}/> Caução/Staking (R$)
                        </label>
                        <input 
                          type="number" 
                          value={form.valor_staking} 
                          onChange={(e) => setForm({...form, valor_staking: Number(e.target.value)})}
                          className="w-full bg-black border border-amber-900/50 rounded-lg p-3 text-sm text-amber-500 focus:border-amber-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-neutral-300 mb-1">Histórico (Obras)</label>
                        <input 
                          type="number" 
                          value={form.obras} 
                          onChange={(e) => setForm({...form, obras: Number(e.target.value)})}
                          className="w-full bg-black border border-[#353535] rounded-lg p-3 text-sm text-white focus:border-[#18B6F6] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-300 mb-1">Atrasos Anteriores</label>
                        <input 
                          type="number" 
                          value={form.atrasos} 
                          onChange={(e) => setForm({...form, atrasos: Number(e.target.value)})}
                          className="w-full bg-black border border-[#353535] rounded-lg p-3 text-sm text-white focus:border-[#18B6F6] outline-none"
                        />
                      </div>
                    </div>

                    <button 
                      onClick={handleSimularIA}
                      disabled={loadingRust}
                      className="w-full mt-4 bg-gradient-to-r from-[#2FFFFF] to-[#18B4F4] text-black font-bold py-3 px-4 rounded-lg flex justify-center items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {loadingRust ? <Cpu className="animate-spin" size={20} /> : <Cpu size={20} />}
                      {loadingRust ? 'Analisando Q-Matrix...' : '1. Acionar Agente'}
                    </button>
                    {/* FIM DO CÓDIGO QUE VOCÊ COLOU */}
                  </div>
                </div>

                {/* Cartão de Resultado da IA */}
                <div className="bg-[#080808] border border-[#353535] rounded-xl p-6 flex flex-col shadow-2xl relative overflow-hidden">
                  <div className="flex items-center gap-3 mb-6 border-b border-[#353535] pb-4">
                    <CheckCircle className="text-[#18B6F6]" size={24} />
                    <h2 className="text-base font-bold text-white tracking-wide">Veredito do Agente (Off-Chain)</h2>
                  </div>

                  {!resultadoIA && !loadingRust && (
                    <div className="flex-1 flex flex-col items-center justify-center text-neutral-500">
                      <Cpu size={48} className="mb-4 opacity-20" />
                      <p className="text-sm">Aguardando submissão do formulário...</p>
                    </div>
                  )}

                  {loadingRust && (
                    <div className="flex-1 flex flex-col items-center justify-center text-[#18B6F6] animate-pulse">
                      <Network size={48} className="mb-4" />
                      <p className="text-sm font-bold">Processando Equação de Bellman...</p>
                    </div>
                  )}

                  {resultadoIA && !loadingRust && (
                    <div className="flex-1 flex flex-col justify-between animate-in slide-in-from-right-4">
                      <div>
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-xs text-neutral-300">Score de Risco Calculado</span>
                          <span className={`text-3xl font-bold ${resultadoIA.aprovado_ia ? 'text-emerald-500' : 'text-red-500'}`}>
                            {resultadoIA.score_risco}/100
                          </span>
                        </div>
                        <div className="w-full bg-neutral-900 rounded-full h-2 mb-6">
                          <div 
                            className={`h-2 rounded-full ${resultadoIA.aprovado_ia ? 'bg-emerald-500' : 'bg-red-500'}`} 
                            style={{ width: `${resultadoIA.score_risco}%` }}
                          ></div>
                        </div>
                        
                        <div className="bg-black border border-[#353535] rounded-lg p-4 mb-4">
                          <span className="text-xs text-neutral-500 block mb-1">Mensagem do Sistema</span>
                          <span className="text-sm text-white">{resultadoIA.mensagem}</span>
                        </div>
                        <div className="flex justify-between text-xs text-neutral-500 font-mono mb-6">
                          <span>Q-Value Máximo: {resultadoIA.q_value_calculado}</span>
                          <span>Estado: {resultadoIA.aprovado_ia ? 'Convergido' : 'Divergente'}</span>
                        </div>
                      </div>

                      <button 
                        disabled={!resultadoIA.aprovado_ia}
                        onClick={() => {
                          setModalMetaMask('confirming');
                          setTimeout(() => setModalMetaMask('done'), 2000);
                        }}
                        className={`w-full py-3 px-4 rounded-lg flex justify-center items-center gap-2 font-bold transition-all ${
                          resultadoIA.aprovado_ia 
                            ? 'bg-[#18B6F6] text-black hover:bg-[#2FFFFF]' 
                            : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                        }`}
                      >
                        <Lock size={20} />
                        {resultadoIA.aprovado_ia ? '2. Assinar Transação Web3' : 'Transação Bloqueada pela IA'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Widgets Inferiores */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="bg-[#080808] border border-[#353535] rounded-xl p-5 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-neutral-400 flex items-center gap-1 mb-1"><LinkIcon size={12}/> Oráculo de Preço ETH/BRL</span>
                    <span className="text-2xl font-bold text-white">R$ 15.863,45</span>
                  </div>
                  <span className="text-emerald-500 text-sm font-bold bg-emerald-500/10 px-2 py-1 rounded-md flex items-center gap-1">
                    ▲ 2.4%
                  </span>
                </div>
                
                <div className="bg-[#080808] border border-[#353535] rounded-xl p-5 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-neutral-400 flex items-center gap-1 mb-1"><Network size={12}/> Saúde da Rede (Foundry RPC)</span>
                    <span className="text-sm text-white font-mono">Status: Sincronizado</span>
                  </div>
                  <span className="text-cyan-500 text-sm font-bold bg-cyan-900/30 px-3 py-1 rounded-md">
                    12 ms
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Aba 2: Tribunal DAO */}
          
          {abaAtiva === 'tribunal' && (
            <div className={`space-y-6 animate-in fade-in duration-500 ${isHalted ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
              <div className="flex items-center justify-between bg-[#080808] border border-[#353535] p-6 rounded-xl">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Gavel className="text-[#18B6F6]" /> Tribunal Cidadão (Slashing)
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1">Vote para reter o Vesting de empresas ou submeta uma denúncia.</p>
                </div>
                <div className="flex items-center gap-4">
                  {/* BOTÃO WHISTLEBLOWER (Pilar 10) */}
                  <button
                    onClick={() => setShowDenuncia(!showDenuncia)}
                    className="flex items-center gap-2 bg-purple-950/40 border border-purple-900 text-purple-400 px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-900/60 transition-all"
                  >
                    <ShieldAlert size={16} />
                    Canal Whistleblower
                  </button>
                  <div className="bg-cyan-950/30 border border-cyan-900 p-3 rounded-lg text-center">
                    <span className="block text-xs text-cyan-500 mb-1">Seu Poder de Voto</span>
                    <span className="text-lg font-bold text-white">450 GVLT</span>
                  </div>
                </div>
              </div>

              {/* PAINEL DE DENÚNCIA (Whistleblower) */}
              {showDenuncia && (
                <div className="bg-[#050505] border border-purple-900/50 p-6 rounded-xl animate-in slide-in-from-top-4">
                  <h3 className="text-purple-400 font-bold mb-2 flex items-center gap-2"><Lock size={16}/> Denúncia Anônima (Bounty Ativo)</h3>
                  <p className="text-xs text-neutral-400 mb-4">Insira o Hash IPFS contendo o dossiê de provas (PDF/Imagens). Se a DAO validar a fraude matemática, 5% do Slashing retido será transferido para sua carteira anonimamente.</p>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Ex: QmXyZ1... (Hash IPFS)"
                      value={hashIPFS}
                      onChange={(e) => setHashIPFS(e.target.value)}
                      className="flex-1 bg-black border border-[#353535] rounded-lg p-3 text-white focus:border-purple-500 focus:outline-none font-mono text-sm"
                    />
                    <button
                      onClick={() => {
                        if(!hashIPFS) return toast.error("Insira o Hash IPFS da prova.");
                        toast.success("Dossiê encriptado e submetido à rede!");
                        addLog(`> [WHISTLEBLOWER] Dossiê submetido. IPFS Hash: ${hashIPFS.substring(0,8)}...`);
                        addLog(`> Contrato de Bounty ativado. Aguardando validação do Oráculo...`);
                        setHashIPFS('');
                        setShowDenuncia(false);
                      }}
                      className="bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-500 transition-colors"
                    >
                      Selar Denúncia
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {casosDAO.map((caso) => {
                  const total = caso.votosContra + caso.votosFavor;
                  const pctContra = Math.round((caso.votosContra / total) * 100);
                  const pctFavor = Math.round((caso.votosFavor / total) * 100);

                  return (
                    <div key={caso.id} className="bg-[#080808] border border-[#353535] p-6 rounded-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-red-950/40 text-red-500 text-[10px] font-bold px-3 py-1 border-b border-l border-red-900/50 rounded-bl-lg">
                        ALERTA DE RISCO
                      </div>
                      
                      <div className="mb-4 mt-2">
                        <span className="text-sm font-mono text-[#18B6F6]">{caso.id}</span>
                        <h3 className="text-lg font-bold text-white mt-1">{caso.empresa}</h3>
                        <p className="text-xs text-neutral-300 mt-1">Acusação: {caso.acusacao}</p>
                      </div>

                      <div className="mb-6">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-red-400 font-bold">Punir ({pctContra}%)</span>
                          <span className="text-emerald-400 font-bold">Absolver ({pctFavor}%)</span>
                        </div>
                        <div className="w-full h-3 bg-neutral-900 rounded-full flex overflow-hidden">
                          <div className="bg-red-500 h-full transition-all" style={{ width: `${pctContra}%` }}></div>
                          <div className="bg-emerald-500 h-full transition-all" style={{ width: `${pctFavor}%` }}></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-neutral-500 font-mono mt-1">
                          <span>{caso.votosContra} GVLT</span>
                          <span>{caso.votosFavor} GVLT</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => {
                            toast.success("Voto computado via Conviction Voting!");
                            addLog(`> Voto registrado para SLA-Slashing no caso ${caso.id}`);
                          }}
                          className="bg-red-950/30 border border-red-900/50 text-red-400 hover:bg-red-900/40 py-2 rounded-lg text-sm font-bold transition-all"
                        >
                          Votar para Punir
                        </button>
                        <button 
                          onClick={() => {
                            toast.success("Voto computado via Conviction Voting!");
                            addLog(`> Voto registrado para absolvição no caso ${caso.id}`);
                          }}
                          className="bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 hover:bg-emerald-900/40 py-2 rounded-lg text-sm font-bold transition-all"
                        >
                          Votar Absolvição
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

{/* A parte 3 continuará a partir daqui, com a Aba 3 (Chat IA + Árvore de Rastreabilidade).*/}


          {/* Aba 3: Transparência, Chat IA e Rastreabilidade */}
          {abaAtiva === 'transparencia' && (
            <div className={`space-y-6 animate-in fade-in duration-500 ${isHalted ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
              
              {/* --- INÍCIO DO NOVO BLOCO (PARTE 3): Gêmeo Digital (NFT) e IPFS --- */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Pilar 16: Dynamic NFT (Gêmeo Digital) */}
                <div className="lg:col-span-2 bg-[#050505] border border-cyan-900/50 p-6 rounded-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-cyan-950/40 text-cyan-500 text-[10px] font-bold px-3 py-1 border-b border-l border-cyan-900/50 rounded-bl-lg uppercase">
                    Pilar 16: ERC-1155 NFT Dinâmico
                  </div>
                  <h3 className="text-white font-bold mb-1 flex items-center gap-2"><Layers className="text-cyan-400" size={18} /> Gêmeo Digital da Obra</h3>
                  <p className="text-xs text-neutral-400 mb-6">Os metadados do NFT atualizam on-chain conforme a validação do Oráculo, desbloqueando as tranches do Escrow.</p>
                  
                  <div className="flex items-center justify-between relative">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-neutral-900 -z-10 -translate-y-1/2"></div>
                    <div className="absolute top-1/2 left-0 h-1 bg-cyan-500 -z-10 -translate-y-1/2 transition-all duration-1000" style={{ width: faseObraNFT === 1 ? '0%' : faseObraNFT === 2 ? '50%' : '100%' }}></div>
                    
                    {/* Fase 1 */}
                    <div className="flex flex-col items-center gap-2 bg-[#050505] px-2">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${faseObraNFT >= 1 ? 'border-cyan-500 bg-cyan-950/50 text-cyan-400 shadow-[0_0_15px_rgba(24,182,246,0.3)]' : 'border-neutral-800 bg-black text-neutral-600'}`}>
                        <Box size={20} />
                      </div>
                      <span className={`text-[10px] font-bold uppercase ${faseObraNFT >= 1 ? 'text-cyan-400' : 'text-neutral-600'}`}>Fundações</span>
                    </div>

                    {/* Fase 2 */}
                    <div className="flex flex-col items-center gap-2 bg-[#050505] px-2">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${faseObraNFT >= 2 ? 'border-cyan-500 bg-cyan-950/50 text-cyan-400 shadow-[0_0_15px_rgba(24,182,246,0.3)]' : 'border-neutral-800 bg-black text-neutral-600'}`}>
                        <Layers size={20} />
                      </div>
                      <span className={`text-[10px] font-bold uppercase ${faseObraNFT >= 2 ? 'text-cyan-400' : 'text-neutral-600'}`}>Alvenaria</span>
                    </div>

                    {/* Fase 3 */}
                    <div className="flex flex-col items-center gap-2 bg-[#050505] px-2">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${faseObraNFT >= 3 ? 'border-cyan-500 bg-cyan-950/50 text-cyan-400 shadow-[0_0_15px_rgba(24,182,246,0.3)]' : 'border-neutral-800 bg-black text-neutral-600'}`}>
                        <Home size={20} />
                      </div>
                      <span className={`text-[10px] font-bold uppercase ${faseObraNFT >= 3 ? 'text-cyan-400' : 'text-neutral-600'}`}>Acabamentos</span>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-center">
                    <button 
                      onClick={() => {
                        if(faseObraNFT < 3) {
                          setFaseObraNFT((prev) => (prev + 1) as 1|2|3);
                          addLog(`> [ORÁCULO] Novo laudo recebido. Metadados do NFT atualizados para a Fase ${faseObraNFT + 1}.`);
                          addLog(`> [ESCROW] Tranche financeira desbloqueada e enviada via DAG.`);
                          toast.success("Oráculo validou o progresso da obra!");
                        } else {
                          toast.success("A obra já está 100% concluída.");
                        }
                      }}
                      className="bg-[#18B6F6]/10 border border-[#18B6F6]/50 text-[#18B6F6] hover:bg-[#18B6F6]/20 px-4 py-2 rounded text-xs font-bold transition-all"
                    >
                      Simular Oráculo (Avançar Fase)
                    </button>
                  </div>
                </div>

                {/* Pilar 2: IPFS Document Storage */}
                <div className="bg-[#050505] border border-emerald-900/50 p-6 rounded-xl relative">
                   <div className="absolute top-0 right-0 bg-emerald-950/40 text-emerald-500 text-[10px] font-bold px-3 py-1 border-b border-l border-emerald-900/50 rounded-bl-lg uppercase">
                    Pilar 2: IPFS
                  </div>
                  <h3 className="text-white font-bold mb-1 flex items-center gap-2"><Database className="text-emerald-400" size={18} /> Vault Descentralizado</h3>
                  <p className="text-xs text-neutral-400 mb-4">Laudos e contratos ancorados no InterPlanetary File System.</p>
                  
                  <div className="space-y-3">
                    <div className="bg-black border border-[#353535] p-3 rounded flex items-center justify-between group cursor-pointer hover:border-emerald-500/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-neutral-500 group-hover:text-emerald-400" />
                        <span className="text-[11px] text-white font-mono">Contrato_Principal.pdf</span>
                      </div>
                      <span className="text-[9px] text-emerald-600 font-mono bg-emerald-950/30 px-1 py-0.5 rounded">QmYwAP...8vA</span>
                    </div>
                    <div className="bg-black border border-[#353535] p-3 rounded flex items-center justify-between group cursor-pointer hover:border-emerald-500/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-neutral-500 group-hover:text-emerald-400" />
                        <span className="text-[11px] text-white font-mono">Laudo_Engenharia_F1.pdf</span>
                      </div>
                      <span className="text-[9px] text-emerald-600 font-mono bg-emerald-950/30 px-1 py-0.5 rounded">QmZxTb...2qW</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* --- FIM DO NOVO BLOCO (PARTE 3) --- */}
              
              {/* Botão de Toggle do Gráfico de Vesting ORIGINAL */}
              <div className="flex justify-end">
                <button 
                  onClick={() => setShowVestingChart(!showVestingChart)}
                  className="flex items-center gap-2 bg-[#080808] border border-[#353535] px-4 py-2 rounded-lg text-sm font-bold text-neutral-300 hover:text-white hover:border-[#18B6F6] transition-all"
                >
                  <Activity size={16} className="text-[#18B6F6]" />
                  {showVestingChart ? 'Ocultar Cronograma de Vesting' : 'Ver Cronograma de Vesting (SLA)'}
                  {showVestingChart ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {/* Gráfico de Vesting Expansível ORIGINAL */}
              {showVestingChart && (
                <div className="bg-[#080808] border border-[#353535] rounded-xl p-6 h-64 animate-in fade-in slide-in-from-top-2">
                  <h3 className="text-sm font-bold text-white mb-4">Projeção de Liberação do Escrow (SLA)</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dadosVesting}>
                      <defs>
                        <linearGradient id="colorVesting" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#18B6F6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#18B6F6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#353535" vertical={false} />
                      <XAxis dataKey="mes" stroke="#737373" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#737373" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                      <Tooltip contentStyle={{ backgroundColor: '#020202', borderColor: '#353535', color: '#fff' }} />
                      <Area type="monotone" dataKey="liberado" stroke="#18B6F6" strokeWidth={2} fillOpacity={1} fill="url(#colorVesting)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Grid 2 Colunas: Chat (Esquerda) e Árvore (Direita) ORIGINAL */}
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                
                
                {/* Coluna Esquerda: Chat IA (Mais estreita) */}
                <div className="xl:col-span-1 bg-[#080808] border border-[#353535] rounded-xl flex flex-col h-[650px] overflow-hidden shadow-2xl">
                  {/* Header do Chat */}
                  <div className="bg-[#050505] border-b border-[#353535] px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bot size={24} className="text-[#18B6F6]" />
                      <h3 className="text-base font-bold text-white tracking-wide">Assistente GovLedger IA</h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Online
                    </div>
                  </div>

                  {/* Histórico de Mensagens */}
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-4">
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div 
                          className={`max-w-[85%] p-4 rounded-xl text-sm ${
                            msg.role === 'user' 
                              ? 'bg-[#18B6F6]/20 border border-[#18B6F6]/50 text-white rounded-br-none' 
                              : 'bg-black border border-[#353535] text-neutral-300 rounded-bl-none'
                          }`}
                        >
                          {msg.role === 'assistant' ? (
                            <div className="prose prose-invert prose-cyan max-w-none text-sm">
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                          ) : (
                            <p>{msg.content}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Indicador de Digitação */}
                    {chatLoading && (
                      <div className="flex items-start">
                        <div className="bg-black border border-[#353535] p-4 rounded-xl rounded-bl-none flex items-center gap-1">
                          <div className="w-2 h-2 bg-[#18B6F6] rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-[#18B6F6] rounded-full animate-bounce delay-75"></div>
                          <div className="w-2 h-2 bg-[#18B6F6] rounded-full animate-bounce delay-150"></div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Prompts Rápidos (Mostrados apenas no início) */}
                  {chatMessages.length === 1 && (
                    <div className="px-6 pb-2 flex flex-wrap gap-2">
                      {[
                        "Qual o risco de contratar uma empresa com 3+ atrasos?",
                        "Como funciona o Tribunal Cidadão (DAO)?",
                        "Forneça a árvore completa de rastreabilidade",
                        "Explique o mecanismo de Vesting"
                      ].map((prompt, i) => (
                        <button 
                          key={i}
                          onClick={() => enviarMensagem(prompt)}
                          className="bg-[#050505] border border-[#353535] text-xs text-neutral-400 px-3 py-2 rounded-lg hover:border-[#18B6F6] hover:text-[#18B6F6] transition-colors text-left"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Input de Texto */}
                  <div className="p-4 bg-[#050505] border-t border-[#353535]">
                    <div className="relative">
                      <textarea
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Pergunte sobre contratos, riscos ou blockchain (Enter para enviar)..."
                        className="w-full bg-black border border-[#353535] rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:border-[#18B6F6] focus:ring-1 focus:ring-[#18B6F6] outline-none resize-none custom-scrollbar"
                        rows={2}
                      />
                      <button
                        onClick={() => enviarMensagem()}
                        disabled={!chatInput.trim() || chatLoading}
                        className="absolute right-2 bottom-2 p-2 bg-[#18B6F6] text-black rounded-lg hover:bg-[#2FFFFF] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* ======================================================================== */}
                {/* COLE ESTE CÓDIGO LOGO ABAIXO DA DIV DE FECHAMENTO DO CHAT (xl:col-span-1) */}
                {/* ======================================================================== */}

                {/* Coluna Direita: Árvore de Rastreabilidade (Mais Larga para 6 Níveis) */}
                <div className="xl:col-span-3 bg-[#080808] border border-[#353535] rounded-xl p-6 shadow-2xl flex flex-col h-[650px] overflow-y-auto overflow-x-auto custom-scrollbar relative">
                  
                  {/* Fundo decorativo tipo Blueprint Corporativo */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(24,182,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(24,182,246,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

                  <div className="flex items-center gap-3 mb-8 border-b border-[#353535] pb-4 sticky top-0 bg-[#080808]/90 backdrop-blur z-30">
                    <Network className="text-[#18B6F6]" size={24} />
                    <h2 className="text-base font-bold text-white tracking-wide">Grafo Web3 (Deep Audit)</h2>
                    <span className="ml-auto text-xs bg-cyan-900/30 text-cyan-400 px-3 py-1 rounded-full border border-cyan-900/50">
                      Profundidade: Nível {treeLevel}/6
                    </span>
                  </div>

                  {/* Container da Árvore (min-w alto para permitir scroll horizontal sem amassar os blocos) */}
                  <div className="flex-1 flex flex-col items-center pt-2 relative min-w-[900px] pb-16">
                    
                    {/* NÍVEL 0: RAIZ (Sempre Visível) */}
                    <div className="z-10 bg-black border border-[#18B6F6] shadow-[0_0_15px_rgba(24,182,246,0.3)] text-white p-3 rounded-xl w-48 text-center relative hover:scale-105 transition-transform">
                      <span className="block text-[10px] text-neutral-400 mb-1 font-bold uppercase tracking-widest">Origem On-Chain</span>
                      <strong className="text-sm">Tesouro Público</strong>
                      <p className="text-xs text-[#18B6F6] font-mono mt-1">R$ 10.000.000,00</p>
                    </div>

                    <div className={`w-1 bg-cyan-900 transition-all duration-1000 ${treeLevel >= 1 ? 'h-8 opacity-100 shadow-[0_0_15px_#18B6F6]' : 'h-0 opacity-0'}`}></div>

                    {/* NÍVEL 1: ESCROW E FORNECEDORES (Gatilho: UI_TRIGGER_FORNECEDORES) */}
                    <div className={`w-full flex justify-center transition-all duration-1000 ${treeLevel >= 1 ? 'opacity-100' : 'opacity-0'}`}>
                      <div className="w-[85%] flex justify-between relative">
                        {/* Linha Horizontal */}
                        <div className="absolute top-0 left-[25%] right-[25%] h-1 bg-cyan-900 shadow-[0_0_15px_#18B6F6]"></div>

                        {/* Galho Esquerdo: Escrow */}
                        <div className="flex flex-col items-center w-[45%] relative">
                          <div className="h-6 w-1 bg-cyan-900 shadow-[0_0_15px_#18B6F6]"></div>
                          <div className="bg-[#050505] border border-amber-500/50 p-3 rounded-xl w-64 text-center z-10 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                            <span className="block text-[9px] text-neutral-400 font-bold uppercase mb-1 flex items-center justify-center gap-1"><Lock size={10} className="text-amber-500"/> Smart Contract</span>
                            <strong className="text-xs text-amber-500">Escrow SLA (10%)</strong>
                            <p className="text-[10px] font-mono mt-1 text-amber-400/70">Bloqueado: R$ 1.0M</p>
                          </div>

                          {/* Sub-galho Escrow DeFi (Aparece no Nível 3 para preencher a tela) */}
                          <div className={`flex flex-col items-center transition-all duration-1000 ${treeLevel >= 3 ? 'opacity-100 h-20' : 'opacity-0 h-0 overflow-hidden'}`}>
                            <div className="h-6 w-[1px] border-l border-dashed border-amber-900/50"></div>
                            <div className="bg-black border border-neutral-800 p-2 rounded text-center w-[80%] z-10">
                              <span className="text-[9px] text-neutral-500 block">Yield Staking (Aave)</span>
                              <span className="text-[10px] text-amber-400 font-mono">+ R$ 15.420</span>
                            </div>
                          </div>
                        </div>

                        {/* Galho Direito: Fornecedores Primários */}
                        <div className="flex flex-col items-center w-[45%]">
                          <div className="h-6 w-1 bg-cyan-900 shadow-[0_0_15px_#18B6F6]"></div>
                          <div className="bg-[#050505] border border-emerald-500/50 p-3 rounded-xl w-64 text-center z-10 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                            <span className="block text-[9px] text-neutral-400 font-bold uppercase mb-1">Repasse Descentralizado</span>
                            <strong className="text-xs text-emerald-500">Fornecedores Primários (90%)</strong>
                            <p className="text-[10px] font-mono mt-1 text-emerald-400/70">Liberado: R$ 9.0M</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* NÍVEL 2: DETALHES DAS EMPRESAS (Gatilho: UI_TRIGGER_DETALHES) */}
                    <div className={`w-full flex justify-end transition-all duration-1000 ${treeLevel >= 2 ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                      <div className="w-[42.5%] mr-[7.5%] relative flex justify-center">
                        <div className="h-8 w-1 bg-emerald-900/50"></div>
                        
                        <div className="absolute top-8 w-full flex justify-between px-2">
                          <div className="absolute top-0 left-[25%] right-[25%] h-[1px] bg-emerald-900/50"></div>
                          
                          {/* Empresa 1: Cimenteira */}
                          <div className="flex flex-col items-center w-[45%] mt-[-1px]">
                            <div className="h-6 w-[1px] bg-emerald-900/50"></div>
                            <div className="bg-[#020202] border border-neutral-800 p-2.5 rounded-lg w-full text-center z-10">
                              <span className="text-[10px] text-neutral-300 block font-bold">Cimenteira S.A</span>
                              <span className="text-[10px] text-emerald-400 font-mono">R$ 4.5M</span>
                            </div>

                            {/* ================================================================= */}
                            {/* NÍVEL 3: AUDITORIA PROFUNDA (Cimenteira) - UI_TRIGGER_AUDITORIA_PROFUNDA */}
                            <div className={`w-full flex justify-between mt-6 relative transition-all duration-1000 ${treeLevel >= 3 ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                              <div className="absolute -top-6 left-[25%] right-[25%] h-[1px] bg-neutral-800"></div>
                              <div className="absolute -top-6 left-1/2 w-[1px] h-6 bg-neutral-800"></div>
                              
                              {/* Ramo Alerta (Logística) */}
                              <div className="w-[48%] flex flex-col items-center">
                                <div className="h-4 w-[1px] bg-red-900/50"></div>
                                <div className="bg-[#0a0000] border border-red-900/50 p-2 rounded w-full text-center z-10 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
                                  <span className="text-[8px] text-neutral-400 block flex justify-center items-center gap-1">Logística <AlertTriangle size={8} className="text-red-500"/></span>
                                  <span className="text-[9px] text-red-400 font-mono">R$ 1.2M</span>
                                </div>

                                {/* NÍVEL 4: SUBCONTRATOS - UI_TRIGGER_SUBCONTRATOS */}
                                <div className={`w-full flex flex-col items-center transition-all duration-1000 ${treeLevel >= 4 ? 'opacity-100 mt-3' : 'opacity-0 h-0 overflow-hidden'}`}>
                                  <div className="h-4 w-[1px] bg-amber-900/50"></div>
                                  <div className="bg-black border border-amber-900/30 p-2 rounded w-full text-center">
                                    <span className="text-[8px] text-neutral-500 block uppercase">Dist. LogMax</span>
                                  </div>

                                  {/* NÍVEL 5: NOTAS FISCAIS - UI_TRIGGER_NOTAS_FISCAIS */}
                                  <div className={`w-full flex flex-col items-center transition-all duration-1000 ${treeLevel >= 5 ? 'opacity-100 mt-3' : 'opacity-0 h-0 overflow-hidden'}`}>
                                    <div className="h-4 w-[1px] border-l border-dashed border-neutral-700"></div>
                                    <div className="bg-[#050505] border border-neutral-700 p-1.5 rounded w-[90%] text-center border-dashed">
                                      <FileText size={8} className="inline text-cyan-600 mr-1"/>
                                      <span className="text-[8px] text-cyan-500 font-mono">NF-e #10293</span>
                                    </div>

                                    {/* NÍVEL 6: OPERÁRIOS - UI_TRIGGER_OPERARIOS */}
                                    <div className={`w-full flex flex-col items-center transition-all duration-1000 ${treeLevel >= 6 ? 'opacity-100 mt-3' : 'opacity-0 h-0 overflow-hidden'}`}>
                                      <div className="h-4 w-[1px] bg-neutral-800"></div>
                                      <div className="w-full space-y-1.5">
                                        <div className="bg-emerald-950/20 border border-emerald-900/30 p-1.5 rounded w-full text-center flex items-center justify-center gap-1.5">
                                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                          <span className="text-[7px] text-neutral-400 font-mono">0x12..34 (Motorista)</span>
                                        </div>
                                        <div className="bg-emerald-950/20 border border-emerald-900/30 p-1.5 rounded w-full text-center flex items-center justify-center gap-1.5">
                                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse delay-150"></div>
                                          <span className="text-[7px] text-neutral-400 font-mono">0x8a..df (Motorista)</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Ramo Normal (Folha) */}
                              <div className="w-[48%] flex flex-col items-center">
                                <div className="h-4 w-[1px] bg-neutral-800"></div>
                                <div className="bg-black border border-neutral-800 p-2 rounded w-full text-center z-10">
                                  <span className="text-[8px] text-neutral-500 block">Folha Pag.</span>
                                  <span className="text-[9px] text-neutral-300 font-mono">R$ 3.3M</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Empresa 2: Aço Forte */}
                          <div className="flex flex-col items-center w-[45%] mt-[-1px]">
                            <div className="h-6 w-[1px] bg-emerald-900/50"></div>
                            <div className="bg-[#020202] border border-neutral-800 p-2.5 rounded-lg w-full text-center z-10">
                              <span className="text-[10px] text-neutral-300 block font-bold">Aço Forte BR</span>
                              <span className="text-[10px] text-emerald-400 font-mono">R$ 4.5M</span>
                            </div>

                            {/* ================================================================= */}
                            {/* NÍVEL 3: AUDITORIA PROFUNDA (Aço Forte) */}
                            <div className={`w-full flex flex-col items-center mt-6 transition-all duration-1000 ${treeLevel >= 3 ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                              <div className="h-4 w-[1px] bg-neutral-800"></div>
                              <div className="bg-black border border-neutral-800 p-2 rounded w-[80%] text-center z-10">
                                <span className="text-[8px] text-neutral-500 block">Matéria Prima</span>
                                <span className="text-[9px] text-neutral-300 font-mono">R$ 4.0M</span>
                              </div>

                              {/* NÍVEL 4: SUBCONTRATOS */}
                              <div className={`w-full flex flex-col items-center transition-all duration-1000 ${treeLevel >= 4 ? 'opacity-100 mt-3' : 'opacity-0 h-0 overflow-hidden'}`}>
                                <div className="h-4 w-[1px] bg-neutral-800"></div>
                                <div className="bg-black border border-neutral-800 p-2 rounded w-[80%] text-center">
                                  <span className="text-[8px] text-neutral-500 block uppercase">Pedreira Vale</span>
                                </div>

                                {/* NÍVEL 5: NOTAS FISCAIS */}
                                <div className={`w-full flex flex-col items-center transition-all duration-1000 ${treeLevel >= 5 ? 'opacity-100 mt-3' : 'opacity-0 h-0 overflow-hidden'}`}>
                                  <div className="h-4 w-[1px] border-l border-dashed border-neutral-700"></div>
                                  <div className="bg-[#050505] border border-neutral-700 p-1.5 rounded w-[75%] text-center border-dashed">
                                    <FileText size={8} className="inline text-cyan-600 mr-1"/>
                                    <span className="text-[8px] text-cyan-500 font-mono">NF-e #44921</span>
                                  </div>

                                  {/* NÍVEL 6: OPERÁRIOS */}
                                  <div className={`w-full flex flex-col items-center transition-all duration-1000 ${treeLevel >= 6 ? 'opacity-100 mt-3' : 'opacity-0 h-0 overflow-hidden'}`}>
                                    <div className="h-4 w-[1px] bg-neutral-800"></div>
                                    <div className="bg-emerald-950/20 border border-emerald-900/30 p-1.5 rounded w-[90%] text-center flex items-center justify-center gap-1.5">
                                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse delay-300"></div>
                                      <span className="text-[7px] text-neutral-400 font-mono">0xab..cd (Mineiro)</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* ======================================================================== */}
                {/* O SEU CÓDIGO DEVE CONTINUAR AQUI COM O FECHAMENTO DAS DIVS DAS ABAS: */}
                {/* </div> */}
                {/* </div> */}
                {/* </div> */}
                {/* ======================================================================== */}
              </div>
            </div>
          )}
        </div>

        {/* Fechamento da Parte 4 área dinâmica das abas (Coluna Esquerda/Centro) */}
        

        
        

        
        {/* Terminal RL no Rodapé */}
        <div className="mt-8 bg-[#050505] border border-[#353535] rounded-xl p-4 shadow-2xl">
          <div className="flex items-center gap-2 mb-2 border-b border-[#353535] pb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Motor Q-Learning / Logs da EVM</span>
          </div>
          <div className="font-mono text-[11px] leading-relaxed h-[100px] overflow-y-auto custom-scrollbar">
            {terminalLogs.map((log, idx) => (
              <div key={idx} className={`${
                log.includes('REJEITADO') || log.includes('ERRO') ? 'text-red-400' : 
                log.includes('APROVADO') ? 'text-emerald-400' : 
                log.includes('ZK-SNARK') || log.includes('Bellman') ? 'text-cyan-400' : 
                'text-neutral-400'
              } mb-1`}>
                {log}
              </div>
            ))}
            {/* Div invisível para fazer o auto-scroll funcionar */}
            <div ref={terminalEndRef} />
          </div>
        </div>
      </main>

      {/* Rodapé (Footer) */}
      <footer className="border-t border-neutral-900 bg-[#020202] py-4 text-center flex justify-center items-center">
        <p className="text-xs text-neutral-600">
          © 2026 GovLedger. Dados atualizados em tempo real.
        </p>
      </footer>

      {/* Modal de Assinatura Web3 */}
      {modalMetaMask !== 'idle' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-[#080808] border border-[#353535] p-8 rounded-2xl max-w-md w-full shadow-2xl text-center relative overflow-hidden">
            {/* Efeito visual de brilho no topo do modal */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#18B6F6] to-transparent"></div>
            
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-cyan-950/30 rounded-full flex items-center justify-center border border-cyan-900">
                <Lock className="text-[#18B6F6]" size={32} />
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2">Assinatura GovLedgerCore</h2>
            
            {modalMetaMask === 'confirming' && (
              <>
                <p className="text-sm text-neutral-400 mb-8">Aguardando confirmação na sua carteira Web3 para executar o Escrow de 10% e o repasse para fornecedores...</p>
                <div className="flex justify-center mb-4">
                  <div className="w-10 h-10 border-4 border-[#353535] border-t-[#18B6F6] rounded-full animate-spin"></div>
                </div>
              </>
            )}
            
            {modalMetaMask === 'done' && (
              <div className="animate-in zoom-in-95 duration-300">
                <div className="flex justify-center mb-6">
                  <CheckCircle className="text-emerald-500" size={56} />
                </div>
                <p className="text-emerald-500 font-bold text-lg mb-2">Transação Confirmada!</p>
                <p className="text-xs text-neutral-400 mb-4">O contrato inteligente foi executado com sucesso.</p>
                
                <div className="bg-black border border-[#353535] p-3 rounded-lg mb-6 break-all flex flex-col gap-1">
                  <span className="text-[10px] text-neutral-500 uppercase font-bold">TxHash On-Chain</span>
                  <span className="text-xs text-white font-mono">
                    0x8f7b...{Math.random().toString(16).slice(2, 10)}...3c4d
                  </span>
                </div>
                
                <button 
                  onClick={() => {
                    setModalMetaMask('idle');
                    setResultadoIA(null);
                  }}
                  className="w-full bg-[#18B6F6] text-black py-3 rounded-lg font-bold hover:bg-[#2FFFFF] transition-colors"
                >
                  Voltar ao Painel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}