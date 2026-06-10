use axum::{extract::State, routing::post, Json, Router};
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    net::SocketAddr,
    sync::{Arc, RwLock},
};
use tower_http::cors::{Any, CorsLayer};

// 1. Definição das Estruturas de Dados
#[derive(Deserialize, Debug)]
struct PedidoAvaliacao {
    empresa: String,
    numero_edital: String,
    valor_solicitado: f64,
    obras_concluidas: f64,
    atrasos_anteriores: f64,
    valor_staking: f64,
}

#[derive(Serialize)]
struct RespostaAvaliacao {
    score_risco: u8,
    aprovado_ia: bool,
    q_value_calculado: f64,
    mensagem: String,
}

// 2. Estado compartilhado para persistência da memória do agente
struct AppState {
    // HashMap que associa nome da empresa a seu histórico de Q-Value
    history: RwLock<HashMap<String, f64>>,
}

// Constantes do Modelo Q-Learning
const TAXA_APRENDIZADO: f64 = 0.1;
const FATOR_DESCONTO: f64 = 0.9;
const PENALIDADE_ATRASO: f64 = -50.0;
const RECOMPENSA_CONCLUSAO: f64 = 20.0;

#[tokio::main]
async fn main() {
    // Inicialização do estado
    let shared_state = Arc::new(AppState {
        history: RwLock::new(HashMap::new()),
    });

    // Configuração de CORS (Essencial para o Next.js conectar)
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Definição das rotas
    let app = Router::new()
        .route("/api/v1/analyze", post(avaliar_risco))
        .layer(cors)
        .with_state(shared_state);

    let addr = SocketAddr::from(([0, 0, 0, 0], 8081));
    println!(">>> GovLedger Backend rodando em http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn avaliar_risco(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<PedidoAvaliacao>,
) -> Json<RespostaAvaliacao> {
    println!(">>> Processando inferência RL para: {}", payload.empresa);

    // Recupera o histórico da empresa ou usa o valor padrão (50.0)
    let q_value_anterior = {
        let history = state.history.read().unwrap();
        *history.get(&payload.empresa).unwrap_or(&50.0)
    };

    // Lógica da Equação de Bellman
    let recompensa_imediata = (payload.obras_concluidas * RECOMPENSA_CONCLUSAO)
        + (payload.atrasos_anteriores * PENALIDADE_ATRASO);

    let estimativa_futura = if recompensa_imediata > 0.0 { 100.0 } else { 0.0 };
    
    let novo_q_value = q_value_anterior 
        + TAXA_APRENDIZADO * (recompensa_imediata + (FATOR_DESCONTO * estimativa_futura) - q_value_anterior);

    // Atualiza o estado compartilhado com o novo conhecimento do agente
    {
        let mut history = state.history.write().unwrap();
        history.insert(payload.empresa.clone(), novo_q_value);
    }

    let score_final = novo_q_value.clamp(0.0, 100.0) as u8;
    let aprovado = score_final >= 60;

    Json(RespostaAvaliacao {
        score_risco: score_final,
        aprovado_ia: aprovado,
        q_value_calculado: novo_q_value,
        mensagem: format!(
            "Análise do edital {} concluída. Confiança do Agente: {:.2}%",
            payload.numero_edital, novo_q_value
        ),
    })
}