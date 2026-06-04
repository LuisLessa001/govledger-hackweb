# 🏛️ GovLedger (TrustNode Team)

**Sistema descentralizado de auditoria e repasse de verbas públicas.**

O GovLedger resolve o problema do desvio de verbas e atrasos em obras públicas através de uma arquitetura híbrida (On-Chain / Off-Chain).

## 🚀 Arquitetura do Sistema

O projeto está dividido em três microsserviços:

1. **`/govledger-contracts` (Solidity / Foundry)**
   - Smart Contracts que gerenciam o fluxo de dinheiro.
   - Retenção de 10% via Escrow (Vesting) atrelado ao SLA.
   - Roteamento direto de 90% para fornecedores (ex: cimenteiras).
   - GovLedger DAO para punição (Slashing) cidadã.

2. **`/govledger-backend` (Rust)**
   - Motor de IA Off-Chain.
   - Utiliza **Q-Learning (Equação de Bellman)** para calcular o score de risco de construtoras com base no histórico de obras e atrasos, autorizando ou bloqueando transações Web3 antes da execução.

3. **`/govledger-frontend` (Next.js / Tailwind v4)**
   - Interface de auditoria em tempo real.
   - Dashboard de rastreabilidade (Follow the Money).
   - Assistente de Inteligência Artificial (Gemini) integrado com "Visual Consciousness" para interação progressiva com a UI.

## 🛠️ Como rodar o projeto localmente
*(Instruções detalhadas serão adicionadas antes da entrega final)*