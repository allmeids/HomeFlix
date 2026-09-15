# 🎬 HomeFlix

**HomeFlix** é uma plataforma moderna e completa de streaming pessoal e TV ao vivo self-hosted, desenhada com experiência cinematográfica estilo Netflix e arquitetura ultra leve.

Inspirado no motor de resolução de streams e IPTV do ecossistema OnePlay/Kodi e integrado com TMDB, o HomeFlix entrega uma experiência web imersiva compatível com computadores, notebooks, Smart TVs e smartphones na rede local.

---

## ✨ Recursos Principais

- 🎬 **Interface Estilo Netflix:**
  - Hero Banner dinâmico com sinopses, notas e botões de ação rápida
  - Carrosséis com pôsteres verticais de alta resolução para *Em Alta*, *Filmes Populares*, *Séries de Sucesso*, *Top Crítica* e *Animes*
  - Seletor de temporadas e episódios com sinopses individuais
- ⚡ **Continuar Assistindo (Quick Resume):**
  - Barra de progresso visual nos cards
  - Retomada instantânea do ponto exato onde você parou
  - Heartbeat a cada 5 segundos gravando a posição no banco relacional SQLite
- 👥 **Multi-Perfis de Usuário:**
  - Seletor estilo "Quem está assistindo?"
  - Avatares personalizados e isolamento completo de histórico e lista de favoritos
- 📡 **TV ao Vivo & Guia de Canais (170+ Canais):**
  - Guia categorizado (*Filmes e Séries*, *Notícias*, *Animes & Infantil*, *Variedades*, *Música*)
  - Player ao vivo HLS integrado sem travamentos
- 🔍 **VOD Engine Multi-Provider:**
  - Integração Stremio / FrostStream / SuperStream para descoberta e resolução de streams sob demanda (4K, 1080p, Dublado em Português e Legendado)
- 🎥 **Player de Vídeo Customizado:**
  - Suporte completo a HLS e MP4 com aceleração
  - Atalhos de teclado (Espaço para Play/Pause, F para Tela Cheia, Setas para ±10s)
  - Seletor de fontes e qualidade em tempo real

---

## 🚀 Como Iniciar

1. Certifique-se de que as dependências Python estão instaladas:
   ```bash
   pip install fastapi uvicorn requests pydantic
   ```
2. Inicie o servidor:
   ```bash
   ./start.sh
   # ou
   python3 backend/run.py
   ```
3. Acesse no navegador:
   - **Localmente:** `http://localhost:8080`
   - **Na Smart TV / Rede Local:** `http://<SEU_IP_LOCAL>:8080` (ex: `http://172.16.24.138:8080`)

---

## 📁 Estrutura do Projeto

```
HomeFlix/
├── backend/
│   ├── app/
│   │   ├── main.py              # Aplicação FastAPI e rotas
│   │   ├── database.py          # SQLite (Perfis, Progresso, Favoritos)
│   │   ├── services/
│   │   │   ├── tmdb_service.py  # Integração e cache do TMDB
│   │   │   ├── vod_service.py   # Resolução de streams (FrostStream/SuperStream)
│   │   │   ├── live_tv_service.py # Agregação de TV ao Vivo e canais HLS
│   │   │   └── proxy_service.py # Proxy de streaming com Range e CORS
│   │   └── routers/             # Rotas REST modulares
│   ├── requirements.txt
│   └── run.py                   # Inicializador Uvicorn
├── frontend/
│   ├── index.html               # SPA Netflix layout
│   ├── css/style.css            # Tema escuro cinematográfico
│   └── js/
│       ├── api.js               # Cliente HTTP do backend
│       ├── player.js            # Controlador de vídeo e progresso
│       └── app.js               # Orquestrador da interface e catálogo
└── start.sh                     # Script de inicialização rápida
```
