// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract GovLedger {
    
    struct MedicaoObra {
        uint256 id;
        string numeroEdital;
        string descricaoFase;
        string ipfsCID;
        uint256 valorSolicitado;
        uint256 timestampEnvio;
        bool foiAprovado;
        address empresaContratada;
        address fiscalResponsavel;
    }

    mapping(uint256 => MedicaoObra) public medicoes;
    uint256 public totalMedicoes;

    event MedicaoRegistrada(uint256 indexed id, string numeroEdital, address indexed empresa);
    event MedicaoAprovada(uint256 indexed id, address indexed fiscal);

    // FUNÇÃO QUE FALTAVA: Prefeitura deposita o dinheiro
    function depositarVerbaPublica() public payable {
        // O saldo fica retido no contrato
    }

    // Função para a Construtora registrar a entrega de uma fase
    function registrarMedicao(
        string memory _numeroEdital, 
        string memory _descricaoFase, 
        string memory _ipfsCID,
        uint256 _valorSolicitado
    ) public {
        totalMedicoes++;
        
        medicoes[totalMedicoes] = MedicaoObra({
            id: totalMedicoes,
            numeroEdital: _numeroEdital,
            descricaoFase: _descricaoFase,
            ipfsCID: _ipfsCID,
            valorSolicitado: _valorSolicitado,
            timestampEnvio: block.timestamp,
            foiAprovado: false,
            empresaContratada: msg.sender,
            fiscalResponsavel: address(0)
        });

        emit MedicaoRegistrada(totalMedicoes, _numeroEdital, msg.sender);
    }

    // Função para o Tribunal de Contas / Prefeitura auditar e aprovar a fase
    function aprovarMedicao(uint256 _id) public {
        require(_id > 0 && _id <= totalMedicoes, "Medicao inexistente");
        require(!medicoes[_id].foiAprovado, "Esta medicao ja foi aprovada");
        
        require(address(this).balance >= medicoes[_id].valorSolicitado, "Saldo insuficiente no contrato para pagamento");

        medicoes[_id].foiAprovado = true;
        medicoes[_id].fiscalResponsavel = msg.sender;

        address construtora = medicoes[_id].empresaContratada;
        uint256 valorPagamento = medicoes[_id].valorSolicitado;
        payable(construtora).transfer(valorPagamento);

        emit MedicaoAprovada(_id, msg.sender);
    }
}