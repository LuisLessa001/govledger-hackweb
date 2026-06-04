// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Interface para comunicar com o contrato de Identidade/SBT
interface IGovLedgerIdentity {
    function penalizarReputacao(
        address _empresa, 
        uint96 _pontosPerdidos, 
        bool _confiscarCaucao, 
        address _destinoConfisco
    ) external;
}

contract GovLedgerDAO is ReentrancyGuard {
    
    // Erros customizados
    error ApenasAdmin();
    error DenunciaInvalida();
    error VotacaoEncerrada();
    error VotacaoEmAndamento();
    error JaVotou();
    error DenunciaJaExecutada();

    address public adminGoverno;
    IGovLedgerIdentity public identidadeSBT;

    // Estrutura do processo no Tribunal Cidadão
    struct Denuncia {
        address empresaAlvo;
        address denunciante;
        string cidIPFSProvas; // Hash do IPFS com provas (fotos/laudos)
        uint256 votosCulpada;
        uint256 votosInocente;
        uint256 prazoVotacao;
        bool executada;
    }

    mapping(uint256 => Denuncia) public denuncias;
    
    // Controle para garantir que 1 carteira = 1 voto por denúncia
    mapping(uint256 => mapping(address => bool)) public cidadaoJaVotou;
    
    uint256 public totalDenuncias;

    // Constantes do Tribunal
    uint256 public constant DURACAO_VOTACAO = 3 days;
    uint96 public constant PENALIZACAO_PONTOS_SBT = 50;

    // Eventos
    event DenunciaCriada(uint256 indexed id, address indexed alvo, address denunciante);
    event VotoRegistrado(uint256 indexed id, address indexed eleitor, bool culpada);
    event JulgamentoExecutado(uint256 indexed id, bool condenada);

    modifier onlyAdmin() {
        if (msg.sender != adminGoverno) revert ApenasAdmin();
        _;
    }

    constructor() {
        adminGoverno = msg.sender;
    }

    // Vincula a DAO ao contrato de Identidade (Core/SBT)
    function configurarEcossistema(address _identidadeSBT) external onlyAdmin {
        identidadeSBT = IGovLedgerIdentity(_identidadeSBT);
    }

    // Qualquer trabalhador ou cidadão pode denunciar uma fraude
    function abrirDenuncia(address _empresaAlvo, string calldata _cidIPFSProvas) external {
        unchecked { totalDenuncias++; }

        denuncias[totalDenuncias] = Denuncia({
            empresaAlvo: _empresaAlvo,
            denunciante: msg.sender,
            cidIPFSProvas: _cidIPFSProvas,
            votosCulpada: 0,
            votosInocente: 0,
            prazoVotacao: block.timestamp + DURACAO_VOTACAO,
            executada: false
        });

        emit DenunciaCriada(totalDenuncias, _empresaAlvo, msg.sender);
    }

    // Cidadãos votam para julgar a obra
    function votar(uint256 _idDenuncia, bool _votaCulpada) external {
        if (_idDenuncia == 0 || _idDenuncia > totalDenuncias) revert DenunciaInvalida();
        
        Denuncia storage d = denuncias[_idDenuncia];
        
        if (block.timestamp > d.prazoVotacao) revert VotacaoEncerrada();
        if (cidadaoJaVotou[_idDenuncia][msg.sender]) revert JaVotou();

        cidadaoJaVotou[_idDenuncia][msg.sender] = true;

        if (_votaCulpada) {
            d.votosCulpada++;
        } else {
            d.votosInocente++;
        }

        emit VotoRegistrado(_idDenuncia, msg.sender, _votaCulpada);
    }

    // Executa o veredito e distribui as recompensas de forma automática
    function executarJulgamento(uint256 _idDenuncia) external nonReentrant {
        Denuncia storage d = denuncias[_idDenuncia];

        if (block.timestamp <= d.prazoVotacao) revert VotacaoEmAndamento();
        if (d.executada) revert DenunciaJaExecutada();

        d.executada = true;

        // Veredito baseado na maioria simples
        bool condenada = d.votosCulpada > d.votosInocente;

        if (condenada) {
            // Slashing automático: Corta a reputação (SBT) e confisca a caução
            // O denunciante recebe o dinheiro confiscado como recompensa (Bounty)
            identidadeSBT.penalizarReputacao(
                d.empresaAlvo, 
                PENALIZACAO_PONTOS_SBT, 
                true, // Confisca a garantia financeira
                d.denunciante // Destino do dinheiro confiscado
            );
        }

        emit JulgamentoExecutado(_idDenuncia, condenada);
    }
}