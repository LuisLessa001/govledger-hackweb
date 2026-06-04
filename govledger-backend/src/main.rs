use axum::{routing::post, Router, Json};
use serde::{Deserialize, Serialize};
use tower_http::cors::CorsLayer;
use std::net::SocketAddr;

#[derive(Deserialize)]
struct PedidoAvaliacao {
    empresa: String,
    numero_edital: String,
    valor_solicitado: f64,
    obras_concluidas: f64,
    atrasos_anteriores: f64,
}

#[derive(Serialize)]
struct RespostaAvaliacao {
    score_risco: u8,
    aprovado_ia: bool,
    q_value_calculado: f64,
    mensagem: String,
}

// Constantes do Modelo Q-Learning (Sintaxe corrigida)
const TAXA_APRENDIZADO: f64 = 0.1;
const FATOR_DESCONTO: f64 = 0.9;
const PENALIDADE_ATRASO: f64 = -50.0;
const RECOMPENSA_CONCLUSAO: f64 = 20.0;

async fn avaliar_risco(Json(payload): Json<PedidoAvaliacao>) -> Json<RespostaAvaliacao> {
    println!("Iniciando inferência RL para a empresa: {}", payload.empresa);

    // Estado inicial simulado (Q-Value anterior)
    let q_value_anterior = 50.0; 

    // Cálculo da Recompensa Imediata baseada no ambiente (histórico da empresa)
    let recompensa_imediata = (payload.obras_concluidas * RECOMPENSA_CONCLUSAO) 
                            + (payload.atrasos_anteriores * PENALIDADE_ATRASO);

    // Aplicação da Equação de Bellman para atualizar a política de risco
    let estimativa_futura = if recompensa_imediata > 0.0 { 100.0 } else { 0.0 };
    
    let novo_q_value = q_value_anterior + TAXA_APRENDIZADO * (recompensa_imediata + (FATOR_DESCONTO * estimativa_futura) - q_value_anterior);

    // Normalização do Score (0 a 100)
    let score_final = novo_q_value.clamp(0.0, 100.0) as u8;
    
    // Agente decide: Score abaixo de 60 reprova o repasse financeiro
    let aprovado = score_final >= 60;

    Json(RespostaAvaliacao {
        score_risco: score_final,
        aprovado_ia: aprovado,
        q_value_calculado: novo_q_value,
        mensagem: format!("Matriz atualizada. Decisão tomada para o edital {}", payload.numero_edital),
    })
}

#[tokio::main]
async fn main() {
    let cors = CorsLayer::permissive();
    let app = Router::new()
        .route("/api/avaliar-risco", post(avaliar_risco))
        .layer(cors);

    let addr = SocketAddr::from(([127, 0, 0, 1], 8080));
    println!("🚀 Agente RL (Rust) rodando em http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}