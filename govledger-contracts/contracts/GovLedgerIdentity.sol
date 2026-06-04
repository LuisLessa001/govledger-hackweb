// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract GovLedgerIdentity {
    
    // ==========================================
    // CUSTOM ERRORS 
    // ==========================================
    error ApenasAdmin();
    error ApenasDAO();
    error JaPossuiSBT();
    error SbtNaoEncontrado();
    error CaucaoInsuficiente();
    error FalhaAoDevolverCaucao();
    error FalhaAoTransferirConfisco();

    address public adminGoverno;
    address public contratoDAO; // Variável para conectar com o Tribunal Cidadão

    // ==========================================
    // ESTRUTURAS DE DADOS OTIMIZADAS
    // ==========================================
    struct Construtora {
        uint96 reputacao;     
        uint256 caucaoTravada;
        bool ativa;           
    }

    mapping(address => Construtora) public construtoras;

    // ==========================================
    // EVENTOS
    // ==========================================
    event SbtEmitido(address indexed empresa, uint256 caucao);
    event ReputacaoAlterada(address indexed empresa, uint96 novaReputacao);
    event CaucaoConfiscada(address indexed empresa, uint256 valor, address destino);
    event CaucaoDevolvida(address indexed empresa, uint256 valor);

    modifier onlyAdmin() {
        if (msg.sender != adminGoverno) revert ApenasAdmin();
        _;
    }

    // Permite que tanto o Administrador quanto o contrato do Tribunal executem punições
    modifier onlyDAOOrAdmin() {
        if (msg.sender != adminGoverno && msg.sender != contratoDAO) revert ApenasDAO();
        _;
    }

    constructor() {
        adminGoverno = msg.sender;
    }

    // ==========================================
    // INTEGRAÇÃO MODULAR
    // ==========================================
    // Liga este contrato de Identidade ao futuro contrato da DAO
    function setContratoDAO(address _enderecoDAO) external onlyAdmin {
        contratoDAO = _enderecoDAO;
    }

    // ==========================================
    // FUNÇÕES DE IDENTIDADE E STAKING
    // ==========================================
    
    function registrarSBT() external payable {
        if (construtoras[msg.sender].ativa) revert JaPossuiSBT();
        if (msg.value < 1 ether) revert CaucaoInsuficiente(); 

        construtoras[msg.sender] = Construtora({
            reputacao: 100, 
            caucaoTravada: msg.value,
            ativa: true
        });

        emit SbtEmitido(msg.sender, msg.value);
    }

    function penalizarReputacao(
        address _empresa, 
        uint96 _pontosPerdidos, 
        bool _confiscarCaucao, 
        address _tesourariaOuDenunciante // O destino do dinheiro confiscado
    ) external onlyDAOOrAdmin {
        if (!construtoras[_empresa].ativa) revert SbtNaoEncontrado();
        
        if (construtoras[_empresa].reputacao <= _pontosPerdidos) {
            construtoras[_empresa].reputacao = 0; 
        } else {
            construtoras[_empresa].reputacao -= _pontosPerdidos;
        }

        // CORREÇÃO CRÍTICA: O dinheiro confiscado é agora transferido para o destino correto
        if (_confiscarCaucao) {
            uint256 valorConfiscado = construtoras[_empresa].caucaoTravada;
            construtoras[_empresa].caucaoTravada = 0;
            
            (bool sucesso, ) = _tesourariaOuDenunciante.call{value: valorConfiscado}("");
            if (!sucesso) revert FalhaAoTransferirConfisco();

            emit CaucaoConfiscada(_empresa, valorConfiscado, _tesourariaOuDenunciante);
        }

        emit ReputacaoAlterada(_empresa, construtoras[_empresa].reputacao);
    }

    // CORREÇÃO CRÍTICA: Função para a construtora recuperar a caução ao sair do sistema
    function devolverCaucao() external {
        if (!construtoras[msg.sender].ativa) revert SbtNaoEncontrado();
        
        uint256 valorParaDevolver = construtoras[msg.sender].caucaoTravada;
        construtoras[msg.sender].caucaoTravada = 0;
        construtoras[msg.sender].ativa = false; // Desativa o SBT

        (bool sucesso, ) = msg.sender.call{value: valorParaDevolver}("");
        if (!sucesso) revert FalhaAoDevolverCaucao();

        emit CaucaoDevolvida(msg.sender, valorParaDevolver);
    }

    // ==========================================
    // FUNÇÕES DE LEITURA (VIEW)
    // ==========================================
    function obterReputacao(address _empresa) external view returns (uint96) {
        return construtoras[_empresa].reputacao;
    }

    function possuiSBT(address _empresa) external view returns (bool) {
        return construtoras[_empresa].ativa;
    }
}