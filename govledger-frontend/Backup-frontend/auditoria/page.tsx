"use client";

import { useState, useEffect } from "react";
import GovLedgerABI from "../../abi/GovLedger.json";
import { useRouter } from "next/navigation";
import { createWalletClient, createPublicClient, custom, http, formatEther, parseEther } from "viem";
import { hardhat } from "viem/chains";
import toast, { Toaster } from "react-hot-toast"; // <-- Importação do Feedback Visual

const CONTRATO_ENDERECO = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

interface Medicao {
  id: number;
  numeroEdital: string;
  descricaoFase: string;
  ipfsCID: string;
  valorSolicitado: string;
  timestampEnvio: number;
  foiAprovado: boolean;
  empresaContratada: string;
}

export default function AuditoriaPainel() {
  const router = useRouter();
  const [medicoes, setMedicoes] = useState<Medicao[]>([]);
  const [saldoContrato, setSaldoContrato] = useState<string>("0");
  
  // Estados para gerir a Interface (UX)
  const [isLoading, setIsLoading] = useState(true);
  const [isDepositing, setIsDepositing] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  const carregarDados = async () => {
    try {
      const publicClient = createPublicClient({ chain: hardhat, transport: http("http://127.0.0.1:8545") });

      const balance = await publicClient.getBalance({ address: CONTRATO_ENDERECO });
      setSaldoContrato(formatEther(balance));

      const total = await publicClient.readContract({
        address: CONTRATO_ENDERECO,
        abi: GovLedgerABI.abi,
        functionName: "totalMedicoes",
      }) as bigint;

      const totalNumber = Number(total);
      const arrayTemporario: Medicao[] = [];

      for (let i = 1; i <= totalNumber; i++) {
        const medicao = await publicClient.readContract({
          address: CONTRATO_ENDERECO,
          abi: GovLedgerABI.abi,
          functionName: "medicoes",
          args: [i],
        }) as any[];
        
        arrayTemporario.push({
          id: Number(medicao[0]),
          numeroEdital: medicao[1],
          descricaoFase: medicao[2],
          ipfsCID: medicao[3],
          valorSolicitado: formatEther(medicao[4]),
          timestampEnvio: Number(medicao[5]),
          foiAprovado: medicao[6],
          empresaContratada: medicao[7],
        });
      }

      setMedicoes(arrayTemporario.reverse());
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao sincronizar com a blockchain.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const garantirRedeHardhat = async () => {
    if (!window.ethereum) throw new Error("MetaMask em falta");
    try {
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x7a69' }] });
    } catch (error: any) {
      if (error.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x7a69', chainName: 'Hardhat Local', rpcUrls: ['http://127.0.0.1:8545'],
            nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 }
          }],
        });
      } else throw error;
    }
  };

  const depositarFundos = async () => {
    setIsDepositing(true);
    const toastId = toast.loading("A aguardar aprovação na MetaMask..."); // Inicia a notificação de carregamento
    
    try {
      await garantirRedeHardhat();
      const walletClient = createWalletClient({ chain: hardhat, transport: custom(window.ethereum) });
      const [account] = await walletClient.requestAddresses();

      const hash = await walletClient.writeContract({
        address: CONTRATO_ENDERECO,
        abi: GovLedgerABI.abi,
        functionName: "depositarVerbaPublica",
        account,
        value: parseEther("20"), 
      });

      toast.success(
        <div>
          <b>Fundos depositados!</b><br/>
          <span className="text-xs">Hash: {hash.substring(0, 15)}...</span>
        </div>, 
        { id: toastId, duration: 5000 } // Atualiza o toast de carregamento para Sucesso
      );
      
      carregarDados();
    } catch (e: any) {
      console.error(e);
      toast.error("Falha ao depositar fundos.", { id: toastId });
    } finally {
      setIsDepositing(false);
    }
  };

  const aprovarFase = async (id: number) => {
    setApprovingId(id);
    const toastId = toast.loading(`A processar pagamento para a Medição #${id}...`);

    try {
      await garantirRedeHardhat();
      const walletClient = createWalletClient({ chain: hardhat, transport: custom(window.ethereum) });
      const [account] = await walletClient.requestAddresses();

      const hash = await walletClient.writeContract({
        address: CONTRATO_ENDERECO,
        abi: GovLedgerABI.abi,
        functionName: "aprovarMedicao",
        account,
        args: [id],
      });

      toast.success(
        <div>
          <b>Pagamento Transferido!</b><br/>
          <span className="text-xs">O contrato Escrow libertou os fundos.</span>
        </div>, 
        { id: toastId, duration: 6000 }
      );
      
      carregarDados();
    } catch (e: any) {
      console.error(e);
      toast.error("Erro ao aprovar. Verifique o saldo do contrato.", { id: toastId });
    } finally {
      setApprovingId(null);
    }
  };


  const analisarComIA = async (medicao: Medicao) => {
    const toastId = toast.loading(`A IA está a analisar a medição #${medicao.id}...`);
    
    try {
      const res = await fetch('/api/ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          edital: medicao.numeroEdital, 
          fase: medicao.descricaoFase, 
          valor: medicao.valorSolicitado 
        })
      });
      
      const data = await res.json();

      if (data.score >= 80) {
        toast.success(
          <div>
            <b>Score Seguro: {data.score}/100</b><br/>
            <span className="text-xs">{data.parecer}</span>
          </div>, 
          { id: toastId, duration: 8000 }
        );
      } else {
        toast.error(
          <div>
            <b>Risco Detetado! Score: {data.score}/100</b><br/>
            <span className="text-xs">{data.parecer}</span>
          </div>, 
          { id: toastId, duration: 8000 }
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao comunicar com o Cérebro de IA.", { id: toastId });
    }
  };

  return (
    <main className="min-h-screen p-10 bg-zinc-950 text-zinc-50 flex flex-col items-center">
      {/* Componente que renderiza as notificações no ecrã */}
      <Toaster position="top-right" toastOptions={{ style: { background: '#18181b', color: '#fff', border: '1px solid #27272a' } }} />
      
      <div className="w-full max-w-5xl">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-emerald-500">Portal de Auditoria</h1>
            <p className="text-zinc-400 mt-1">Valide laudos e liberte pagamentos automatizados.</p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm transition-all">
              <span className="text-zinc-400">Saldo do Contrato (Escrow):</span>
              <span className={`font-mono font-bold ${Number(saldoContrato) > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {saldoContrato} ETH
              </span>
            </div>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={depositarFundos} 
              disabled={isDepositing}
              className={`px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 ${
                isDepositing ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {isDepositing ? "A Depositar..." : "Depositar Verba (Prefeitura)"}
            </button>
            <button onClick={() => router.push("/")} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition">
              Voltar
            </button>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
          {isLoading ? (
            <div className="p-10 flex flex-col items-center gap-4 text-zinc-500">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              A comunicar com a rede local...
            </div>
          ) : medicoes.length === 0 ? (
            <div className="p-10 text-center text-zinc-500">Nenhuma medição registada no sistema.</div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-zinc-950 border-b border-zinc-800 text-sm text-zinc-400">
                <tr>
                  <th className="p-4 font-medium">ID</th>
                  <th className="p-4 font-medium">Edital</th>
                  <th className="p-4 font-medium">Fase</th>
                  <th className="p-4 font-medium">Valor (ETH)</th>
                  <th className="p-4 font-medium">Estado</th>
                  <th className="p-4 font-medium">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {medicoes.map((m) => (
                  <tr key={m.id} className="hover:bg-zinc-800/50 transition">
                    <td className="p-4 text-zinc-400">#{m.id}</td>
                    <td className="p-4 font-bold text-emerald-400">{m.numeroEdital}</td>
                    <td className="p-4">{m.descricaoFase}</td>
                    <td className="p-4 font-mono font-bold">{m.valorSolicitado}</td>
                    <td className="p-4">
                      {m.foiAprovado ? (
                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded text-xs font-bold border border-emerald-500/20">PAGO</span>
                      ) : (
                        <span className="px-2 py-1 bg-amber-500/10 text-amber-500 rounded text-xs font-bold border border-amber-500/20">PENDENTE</span>
                      )}
                    </td>
                    <td className="p-4 flex gap-2">
                      {!m.foiAprovado && (
                        <>
                          <button 
                            onClick={() => analisarComIA(m)}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded shadow-lg shadow-purple-900/20 transition-all"
                          >
                             Analisar com IA
                          </button>
                          <button 
                            onClick={() => aprovarFase(m.id)}
                            disabled={approvingId === m.id}
                            className={`px-3 py-1 text-sm font-bold rounded shadow-lg transition-all ${
                              approvingId === m.id 
                                ? 'bg-zinc-700 text-zinc-400 cursor-wait'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'
                            }`}
                          >
                            {approvingId === m.id ? "A Processar..." : "Aprovar"}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}