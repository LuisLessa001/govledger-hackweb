Equipe TrustNode
Membro: Luís André Oliveira Lessa


# ⚡ GovLedger | Trustless State Infrastructure

> **Garantindo a execução de contratos públicos através de Inteligência Artificial Off-Chain e Smart Contracts On-Chain.**

O **GovLedger** é uma infraestrutura descentralizada desenvolvida para eliminar fraudes, atrasos e inadimplência em licitações e obras públicas. Utilizando um motor preditivo de alta performance construído em Rust e o conceito de *Staking* em Blockchain, o sistema cria um ambiente onde o risco é calculado matematicamente e a garantia de execução é imutável.

---

## 🛠️ Arquitetura Técnica

O projeto foi construído utilizando uma arquitetura híbrida, separando o processamento pesado de IA da camada de consenso da Blockchain:

* **Frontend:** Next.js (React), Tailwind CSS, Lucide Icons, Ethers.js.
* **Motor Off-Chain (IA):** Desenvolvido em **Rust**. Utiliza algoritmos de Aprendizado por Reforço (Baseado na Equação de Bellman) para calcular o risco da construtora com base no histórico de obras e atrasos.
* **Camada Web3 (Blockchain):** Smart Contracts em Solidity, testados e implantados via Hardhat na rede local. Integração direta com carteiras via MetaMask.

---

## 🚀 Funcionalidades Principais

### 1. Motor Preditivo de Risco (Rust + RL)
Antes de qualquer assinatura de contrato, o agente preditivo off-chain avalia os dados da empresa. Se o *Score de Risco* ultrapassar o limite aceitável, o sistema aciona um **Circuit Breaker**, bloqueando a transação Web3 instantaneamente.


### 2. Escrow e Staking Imutável (Smart Contracts)
Construtoras aprovadas pela IA são obrigadas a travar uma caução (Staking) diretamente no Smart Contract do GovLedger. Esses fundos ficam bloqueados e garantem a execução do edital. Em caso de quebra de contrato, ocorre o *Slashing* (penalização).

### 3. Deep Audit e Grafo Web3 de Rastreabilidade
Transparência total para o dinheiro público. O GovLedger mapeia toda a árvore de repasses, desde a origem no Tesouro Público até os fornecedores primários e subcontratados (logística, matéria-prima, etc.).


---

## 💻 Como rodar o projeto localmente

Siga os passos abaixo para inicializar o ambiente de desenvolvimento completo (Requer Node.js, Rust/Cargo e WSL/Linux):

### Passo 1: Iniciar o Nó da Blockchain
Em um terminal, inicie a rede local do Hardhat:
```bash
cd govledger-contracts
npx hardhat node --hostname 0.0.0.0 --port 8546

```

### Passo 2: Implantar o Smart Contract

Abra um segundo terminal na mesma pasta e faça o deploy do contrato na rede local:

```bash
cd govledger-contracts
npx hardhat ignition deploy ignition/modules/GovLedger.ts --network localhost --reset

```

### Passo 3: Iniciar o Motor de IA (Rust)

Abra um terceiro terminal e inicie o servidor de alta performance que fará os cálculos de Aprendizado por Reforço:

```bash
cd govledger-backend
cargo build --release
./target/release/govledger-backend

```

### Passo 4: Iniciar a Interface (Frontend)

Em um quarto terminal, rode o Next.js em modo de produção para garantir estabilidade na comunicação via RPC:

```bash
cd govledger-frontend
npm run build
npm run start -- -H 0.0.0.0

```

Acesse `http://localhost:3000` no seu navegador. Certifique-se de configurar a sua MetaMask para a rede Localhost (porta 8546) para interagir com o sistema.

---

**Desenvolvido para Hackathon 2026** 🚀

```
