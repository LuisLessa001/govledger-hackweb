// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/GovLedgerIdentity.sol";
import "../contracts/GovLedgerCore.sol";
import "../contracts/GovLedgerDAO.sol";

// ==========================================
// MOCKS PARA AMBIENTE LOCAL
// ==========================================
// Falsifica as respostas externas para podermos testar o sistema sem internet
contract MockOraculoAmbiental {
    function verificarConformidadeAmbiental(string calldata) external pure returns (bool) {
        return true; // Simula que a obra está sempre 100% ecológica no teste
    }
}

contract MockOraculoPreco {
    function latestRoundData() external pure returns (
        uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound
    ) {
        return (0, 3000 * 1e8, 0, 0, 0); // Simula que 1 ETH = 3.000 Dólares
    }
}

contract DeployGovLedger is Script {
    
    function run() external {
        // Inicia a gravação da transação na blockchain
        vm.startBroadcast();

        // 1. Deploy dos Mocks
        MockOraculoAmbiental mockAmbiental = new MockOraculoAmbiental();
        MockOraculoPreco mockPreco = new MockOraculoPreco();

        // 2. Deploy dos Pilares Principais
        GovLedgerIdentity identidade = new GovLedgerIdentity();
        GovLedgerDAO dao = new GovLedgerDAO();
        GovLedgerCore core = new GovLedgerCore();

        // 3. Orquestração (A "Cola" do Ecossistema)
        
        // Permite que o Tribunal aplique multas e confisque cauções
        identidade.setContratoDAO(address(dao));

        // Conecta o Tribunal à base de Identidades
        dao.configurarEcossistema(address(identidade));

        // Conecta o Cofre Central a todas as partes e oráculos
        core.configurarEcossistema(
            address(identidade),
            address(dao),
            address(mockAmbiental),
            address(mockPreco)
        );

        // Encerra a gravação
        vm.stopBroadcast();
    }
}