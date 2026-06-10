"use client";

import { useState } from "react";
import GovLedgerABI from "../../abi/GovLedger.json"
import { useRouter } from "next/navigation";
import { createWalletClient, custom, parseEther } from "viem";
import { hardhat } from "viem/chains";

// 1. O Endereço do seu Contrato (Aquele que você acabou de me enviar!)
const CONTRATO_ENDERECO = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";


export default function ConstrutoraPainel() {
  const router = useRouter();
  const [edital, setEdital] = useState("");
  const [fase, setFase] = useState("");
  const [cid, setCid] = useState("");
  const [valor, setValor] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Verifica se a MetaMask está instalada
      if (!window.ethereum) {
        throw new Error("MetaMask não encontrada!");
      }
      try {
        // Tenta forçar a MetaMask a mudar para o Hardhat (ID 31337 em Hexadecimal é 0x7a69)
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x7a69' }],
        });
      } catch (switchError: any) {
        // O código de erro 4902 significa que a rede não existe (ou está corrompida). 
        // Se der esse erro, nós forçamos a criação de uma rede limpa.
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x7a69',
                chainName: 'Hardhat Local (Automático)',
                rpcUrls: ['http://127.0.0.1:8545'],
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: 'ETH',
                  decimals: 18,
                },
              },
            ],
          });
        } else {
          throw switchError;
        }
      }

      // Cria o cliente da carteira usando o Viem
      const walletClient = createWalletClient({
        chain: hardhat,
        transport: custom(window.ethereum),
      });

      // Pega a conta que está conectada no momento
      const [account] = await walletClient.requestAddresses();

      console.log("A enviar transação para a Blockchain...");

      // 3. A CHAMADA REAL PARA O SMART CONTRACT
      const hash = await walletClient.writeContract({
        address: CONTRATO_ENDERECO,
        abi: GovLedgerABI.abi,
        functionName: "registrarMedicao",
        account: account,
        // O parseEther converte "50" para os 18 zeros que a Ethereum exige (Wei)
        args: [edital, fase, cid, parseEther(valor)], 
      });

      console.log("Hash da Transação:", hash);
      alert(`Sucesso! Obra registada na blockchain.\nHash: ${hash}`);
      
      setEdital("");
      setFase("");
      setCid("");
      setValor("");
    } catch (error: any) {
      console.error("Erro ao registar obra:", error);
      alert("Falha na transação. Verifique o console para mais detalhes.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-50 p-6">
      <div className="w-full max-w-md bg-zinc-900 p-8 rounded-xl border border-zinc-800 shadow-xl">
        <h1 className="text-3xl font-bold text-blue-500 mb-2">Painel da Construtora</h1>
        <p className="text-sm text-zinc-400 mb-8">
          Registe uma nova obra pública e solicite a alocação de verbas no contrato inteligente.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-zinc-300">Número do Edital</label>
            <input
              type="text"
              value={edital}
              onChange={(e) => setEdital(e.target.value)}
              placeholder="Ex: ED-2026/04"
              required
              className="bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-zinc-300">Descrição da Fase</label>
            <input
              type="text"
              value={fase}
              onChange={(e) => setFase(e.target.value)}
              placeholder="Ex: Fase 1 - Fundações"
              required
              className="bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-zinc-300">IPFS CID (Documentação)</label>
            <input
              type="text"
              value={cid}
              onChange={(e) => setCid(e.target.value)}
              placeholder="Ex: QmHash..."
              required
              className="bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-zinc-300">Valor Solicitado (ETH)</label>
            <input
              type="number"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="Ex: 50.00"
              required
              className="bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 rounded-lg font-bold transition-all ${
              isSubmitting
                ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20"
            }`}
          >
            {isSubmitting ? "A assinar na MetaMask..." : "Registar Medição"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-zinc-800 text-center">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            ← Voltar para o Início
          </button>
        </div>
      </div>
    </main>
  );
}