// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Interfaces externas
interface IGovLedgerIdentity {
    function possuiSBT(address _empresa) external view returns (bool);
    function obterReputacao(address _empresa) external view returns (uint96);
}

interface IOraculoAmbiental {
    function verificarConformidadeAmbiental(string calldata _numeroEdital) external view returns (bool);
}

interface AggregatorV3Interface {
    function latestRoundData() external view returns (
        uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound
    );
}

contract GovLedgerCore is ReentrancyGuard {
    
    // Erros
    error ApenasAdmin();
    error ApenasDAO();
    error IdentidadeNaoVerificada();
    error ReputacaoMuitoBaixa();
    error MedicaoInvalida();
    error MedicaoJaAprovada();
    error ConformidadeAmbientalReprovada();
    error SaldoEscrowInsuficiente();
    error PeriodoGarantiaNaoExpirado();
    error FalhaNaTransferencia();
    error SemGarantiaRetida();
    error ArraysIncompativeis();
    error OraculoPrecoInativo();

    // Endereços de controle
    address public adminGoverno;
    address public contratoDAO;
    
    IGovLedgerIdentity public identidadeSBT;
    IOraculoAmbiental public oraculoAmbiental;
    AggregatorV3Interface public oraculoPreco;

    // Estruturas
    struct MedicaoObra {
        uint256 valorSolicitadoFiat;
        uint256 prazoLimiteSLA;      
        uint256 timestampAprovacao; 
        address empresaContratada;
        string numeroEdital;
        string cidIPFS; 
        bool foiAprovada;
    }

    struct GarantiaVesting {
        uint256 saldoRetidoETH;
        uint256 dataLiberacao; 
    }

    struct RastreabilidadeSuprimentos {
        address[] fornecedores;
        uint256[] valoresDistribuidosFiat;
    }

    // Armazenamento
    mapping(uint256 => MedicaoObra) public medicoes;
    mapping(uint256 => GarantiaVesting) public cofresVestingPorMedicao;
    mapping(uint256 => RastreabilidadeSuprimentos) cadeiasDeSuprimento;
    
    uint256 public totalMedicoes;

    // Constantes
    uint256 public constant PERCENTUAL_RETENCAO = 10;
    uint256 public constant PERIODO_GARANTIA = 365 days;
    uint256 public constant MULTA_ATRASO_POR_DIA = 1; // 1%

    // Eventos
    event MedicaoRegistrada(uint256 indexed id, string edital, address indexed empresa);
    event MedicaoAprovada(uint256 indexed id, uint256 pagamentoConstrutoraETH, uint256 valorRetidoETH, uint256 multaAplicadaETH);
    event PagamentoFornecedor(uint256 indexed idMedicao, address indexed fornecedor, uint256 valorETH);
    event GarantiaVestingLiberada(uint256 indexed idMedicao, address indexed empresa, uint256 valor);

    modifier onlyAdmin() {
        if (msg.sender != adminGoverno) revert ApenasAdmin();
        _;
    }

    modifier onlyDAOOrAdmin() {
        if (msg.sender != adminGoverno && msg.sender != contratoDAO) revert ApenasDAO();
        _;
    }

    constructor() {
        adminGoverno = msg.sender;
    }

    // Configura conexões modulares
    function configurarEcossistema(
        address _identidadeSBT, 
        address _contratoDAO, 
        address _oraculoAmbiental,
        address _oraculoPrecoChainlink
    ) external onlyAdmin {
        identidadeSBT = IGovLedgerIdentity(_identidadeSBT);
        contratoDAO = _contratoDAO;
        oraculoAmbiental = IOraculoAmbiental(_oraculoAmbiental);
        oraculoPreco = AggregatorV3Interface(_oraculoPrecoChainlink);
    }


    // Evento para rastrear o empenho na blockchain
    event ContratoEmpenhado(string empresa, string numeroEdital, uint256 valorStaking, uint8 scoreIA);

    // Função REAL, recebe fundos (payable) e trava no Escrow
    function iniciarContrato(
        string memory _empresa,
        string memory _numeroEdital,
        uint8 _scoreRisco
    ) public payable {
        // Exige que a carteira envie um valor maior que zero
        require(msg.value > 0, "Staking (Caucao) e obrigatorio");
        
        // Exige que a IA tenha aprovado (score >= 60)
        require(_scoreRisco >= 60, "Risco reprovado pela IA");

        // O dinheiro enviado (msg.value) fica automaticamente retido no saldo deste Smart Contract (Escrow)
        
        emit ContratoEmpenhado(_empresa, _numeroEdital, msg.value, _scoreRisco);
    }




    // Registra medição, SLA e fornecedores
    function registrarMedicao(
        string calldata _numeroEdital, 
        string calldata _cidIPFS,
        uint256 _valorSolicitadoFiat,
        uint256 _prazoLimiteSLA,
        address[] calldata _fornecedores,
        uint256[] calldata _valoresDistribuidosFiat
    ) external {
        if (!identidadeSBT.possuiSBT(msg.sender)) revert IdentidadeNaoVerificada();
        if (identidadeSBT.obterReputacao(msg.sender) < 50) revert ReputacaoMuitoBaixa();
        if (_fornecedores.length != _valoresDistribuidosFiat.length) revert ArraysIncompativeis();

        unchecked { totalMedicoes++; } 

        medicoes[totalMedicoes] = MedicaoObra({
            valorSolicitadoFiat: _valorSolicitadoFiat,
            prazoLimiteSLA: _prazoLimiteSLA,
            timestampAprovacao: 0,
            empresaContratada: msg.sender,
            numeroEdital: _numeroEdital,
            cidIPFS: _cidIPFS,
            foiAprovada: false
        });

        cadeiasDeSuprimento[totalMedicoes] = RastreabilidadeSuprimentos({
            fornecedores: _fornecedores,
            valoresDistribuidosFiat: _valoresDistribuidosFiat
        });

        emit MedicaoRegistrada(totalMedicoes, _numeroEdital, msg.sender);
    }

    // Aprova, avalia oráculos, paga fornecedores e aplica Vesting/Multas
    function aprovarMedicao(uint256 _id) external onlyDAOOrAdmin nonReentrant {
        if (_id == 0 || _id > totalMedicoes) revert MedicaoInvalida();
        
        MedicaoObra storage m = medicoes[_id];
        if (m.foiAprovada) revert MedicaoJaAprovada();

        // Verifica oráculo ambiental
        if (!oraculoAmbiental.verificarConformidadeAmbiental(m.numeroEdital)) {
            revert ConformidadeAmbientalReprovada();
        }

        m.foiAprovada = true;
        m.timestampAprovacao = block.timestamp;

        // Conversão Fiat para ETH via Chainlink
        uint256 cotacaoAtual = obterPrecoETH();
        uint256 valorTotalETH = (m.valorSolicitadoFiat * 1e18) / cotacaoAtual;
        
        if (address(this).balance < valorTotalETH) revert SaldoEscrowInsuficiente();

        // Calcula multa por atraso
        uint256 deducaoMultaETH = 0;
        if (block.timestamp > m.prazoLimiteSLA) {
            uint256 diasAtraso = (block.timestamp - m.prazoLimiteSLA) / 1 days;
            deducaoMultaETH = (valorTotalETH * diasAtraso * MULTA_ATRASO_POR_DIA) / 100;
        }

        // Calcula Vesting
        uint256 valorRetidoVestingETH = (valorTotalETH * PERCENTUAL_RETENCAO) / 100;
        
        cofresVestingPorMedicao[_id] = GarantiaVesting({
            saldoRetidoETH: valorRetidoVestingETH,
            dataLiberacao: block.timestamp + PERIODO_GARANTIA
        });

        // Paga fornecedores
        RastreabilidadeSuprimentos memory cadeia = cadeiasDeSuprimento[_id];
        uint256 totalPagoFornecedoresETH = 0;

        for (uint i = 0; i < cadeia.fornecedores.length; i++) {
            uint256 valorFornecedorETH = (cadeia.valoresDistribuidosFiat[i] * 1e18) / cotacaoAtual;
            totalPagoFornecedoresETH += valorFornecedorETH;
            
            (bool sucessoFornecedor, ) = cadeia.fornecedores[i].call{value: valorFornecedorETH}("");
            if (!sucessoFornecedor) revert FalhaNaTransferencia();
            
            emit PagamentoFornecedor(_id, cadeia.fornecedores[i], valorFornecedorETH);
        }

        // Paga construtora
        uint256 pagamentoLiquidoConstrutoraETH = valorTotalETH - totalPagoFornecedoresETH - valorRetidoVestingETH - deducaoMultaETH;

        (bool sucessoConstrutora, ) = m.empresaContratada.call{value: pagamentoLiquidoConstrutoraETH}("");
        if (!sucessoConstrutora) revert FalhaNaTransferencia();

        emit MedicaoAprovada(_id, pagamentoLiquidoConstrutoraETH, valorRetidoVestingETH, deducaoMultaETH);
    }

    // Libera Vesting após 1 ano
    function liberarGarantiaVesting(uint256 _idMedicao) external onlyDAOOrAdmin nonReentrant {
        GarantiaVesting storage cofre = cofresVestingPorMedicao[_idMedicao];
        
        if (cofre.saldoRetidoETH == 0) revert SemGarantiaRetida();
        if (block.timestamp < cofre.dataLiberacao) revert PeriodoGarantiaNaoExpirado();

        uint256 valorLiberado = cofre.saldoRetidoETH;
        cofre.saldoRetidoETH = 0; 

        address empresa = medicoes[_idMedicao].empresaContratada;

        (bool sucesso, ) = empresa.call{value: valorLiberado}("");
        if (!sucesso) revert FalhaNaTransferencia();

        emit GarantiaVestingLiberada(_idMedicao, empresa, valorLiberado);
    }

    // Obtém cotação do Chainlink
    function obterPrecoETH() internal view returns (uint256) {
        (
            , 
            int256 preco, 
            , 
            , 
            
        ) = oraculoPreco.latestRoundData();
        
        if (preco <= 0) revert OraculoPrecoInativo();
        return uint256(preco * 1e10); 
    }


    // Função manual para o Frontend ler os arrays dinâmicos
    function obterCadeiaDeSuprimentos(uint256 _id) external view returns (address[] memory, uint256[] memory) {
        RastreabilidadeSuprimentos storage cadeia = cadeiasDeSuprimento[_id];
        return (cadeia.fornecedores, cadeia.valoresDistribuidosFiat);
    }

    // Recebe depósitos
    receive() external payable {}
}