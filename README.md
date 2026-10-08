# HomeFlix

**HomeFlix** e uma plataforma self-hosted moderna de streaming cinematografico e transmissao de TV ao vivo, projetada para proporcionar uma experiencia fluida e profissional similar a servicos como Netflix e Disney+, com arquitetura ultra leve e de alto desempenho.

Desenvolvido para operar em redes locais e servidores domesticos, o sistema e compativel com Smart TVs, computadores, tablets e smartphones atraves de navegadores modernos ou aplicativo web progressivo (PWA).

---

## Destaques e Funcionalidades

### Experiencia Visual e Interface de Cinema
- **Identidade Visual Profissional:** Tipografia cinematografica inspirada nos principais servicos de streaming, layout responsivo e modo escuro com alto contraste.
- **Navegacao para Smart TV (10-Foot UI):** Suporte total a navegacao por controle remoto, teclado e D-Pad (setas de navegacao, Enter, Espaco, Tecla C para guia de canais, Esc para voltar).
- **Banner Hero Dinamico:** Destaque de lancamentos e titulos populares com sinopses, notas e reproducao com um clique.
- **Carrosseis Inteligentes:** Catalogos com posteres em alta definicao organizados por categorias, generos e acervo em destaque.

### Franquias e Colecoes em Ordem Cronologica
- **Sagas Completas em Sequencia de Assistir:** Hub exclusivo de colecoes no estilo Disney+ com cards panoramicos (16:9) e sequencia recomendada de reproducao:
  - Universo Cinematografico Marvel (MCU)
  - Colecao Harry Potter e Mundo Bruxo
  - Colecao Transformers
  - Saga Dragon Ball (Classico, Z, Super, Filmes e Daima)
  - Universo DC Comics
  - Saga Star Wars (Skywalker e Derivados)
  - Velozes e Furiosos
  - O Senhor dos Aneis e O Hobbit
  - Cavaleiros do Zodíaco (Saint Seiya)
  - Colecao Naruto (Classico, Shippuden e Filmes)

### Catalogo e Varredura Ampla de Conteudo
- **Animes Completos e Lancamentos:** Cobertura de classicos (Cavaleiros do Zodíaco, Dragon Ball, Naruto) e sucessos modernos (Kimetsu no Yaiba, Record of Ragnarok, Jujutsu Kaisen, Attack on Titan).
- **Busca Preditiva com Titulos Semelhantes:** Mecanismo de busca que sugere resultados em tempo real e apresenta recomendacoes semanticas caso o titulo exato nao esteja disponivel.
- **Hub de Categorias e Generos:** Navegacao dedicada por estilos (Acao, Ficcao Cientifica, Comedia, Terror, Documentarios e Familia).

### TV ao Vivo e Guia EPG
- **Mais de 170 Canais em Alta Definicao:** Transmissoes continuas em formato HLS (`.m3u8`) organizadas por categorias.
- **Navegacao por Setas e Carrossel:** Filtro de categorias com botoes de rolagem e compatibilidade com controles remotos.
- **Gaveta Lateral e Guia OSD:** Guia lateral no estilo Pluto TV/Kodi acessivel via tecla `C` ou clique na tela sem interromper a reproducao.

### Gestao Multi-Perfis e Privacidade
- **Tela de Selecao de Perfis:** Gateway inicial ("Quem esta assistindo?") com avatares estilizados e isolamento total de historico, favoritos e continuacao.
- **Privacidade Local Garantida:** O banco de dados SQLite (`homeflix.db`), historico de reproducao e dados de sessao pessoal ficam restritos ao seu servidor local e nunca sao sincronizados ou expostos no repositorio Git.

### Motor de Reproducao e Streaming
- **Continuar Assistindo (Quick Resume):** Sincronizacao de progresso em tempo real a cada 5 segundos com barra de tempo nos cards.
- **Resolucoes e Servidores Multiplos:** Auto-failover inteligente entre servidores para assegurar disponibilidade de reproducao.
- **Controle de Legendas e Audio:** Suporte a legendas em portugues (PT-BR) e ajuste de qualidade dinamico.

---

## Requisitos de Sistema

- **Python:** 3.10 ou superior
- **Navegador:** Google Chrome, Firefox, Safari, Microsoft Edge ou navegador integrado de Smart TV (Tizen, webOS, Android TV, Google TV)
- **Portas:** Porta `8080` liberada para acesso na rede local

---

## Instalacao e Execucao

### 1. Clonar o Repositorio
```bash
git clone https://github.com/almeida-dev/HomeFlix.git
cd HomeFlix
```

### 2. Instalacao das Dependencias

#### No Linux / macOS:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
```

#### No Windows (PowerShell / Prompt de Comando):
```powershell
python -m venv venv
.\venv\Scripts\activate
pip install -r backend\requirements.txt
```

### 3. Executando o Servidor

#### No Linux / macOS:
```bash
chmod +x start.sh
./start.sh
```
Ou diretamente:
```bash
python3 backend/run.py
```

#### No Windows:
```cmd
python backend\run.py
```

### 4. Acesso

- **No proprio computador:** Acesse `http://localhost:8080`
- **Na Smart TV ou outros dispositivos da rede:** Acesse `http://<IP_DO_SEU_SERVIDOR>:8080` (exemplo: `http://192.168.1.100:8080`)

---

## Atalhos de Teclado e Controle Remoto

| Tecla / Botao | Acao |
|---|---|
| **Espaco** | Reproduzir / Pausar |
| **F** | Ativar / Desativar Tela Cheia |
| **Seta Direita / Esquerda** | Avancar / Retroceder 10 segundos |
| **Seta Cima / Baixo** | Proximo Canal / Canal Anterior (Modo TV) |
| **C** | Abrir / Fechar Guia Lateral de Canais |
| **L** ou **CC** | Menu de Legendas PT-BR e Faixas de Audio |
| **Esc** | Fechar modais / Retornar a tela anterior |

---

## Arquitetura do Repositorio

```
HomeFlix/
├── backend/
│   ├── app/
│   │   ├── main.py                # Servidor FastAPI e rotas principais
│   │   ├── database.py            # Esquema relacional SQLite (perfis genericos)
│   │   ├── services/
│   │   │   ├── tmdb_service.py    # Catalogo, colecoes cronologicas e cache
│   │   │   ├── vod_service.py     # Motor multi-provider e failover de streams
│   │   │   ├── live_tv_service.py # Agregador de IPTV e guia de canais
│   │   │   └── proxy_service.py   # Proxy de streaming com Range headers e CORS
│   │   └── routers/               # Endpoints REST modulares
│   ├── requirements.txt           # Dependencias do backend
│   └── run.py                     # Inicializador Uvicorn ASGI
├── frontend/
│   ├── index.html                 # Aplicacao SPA
│   ├── manifest.json              # Configuracao PWA
│   ├── sw.js                      # Service Worker para cache offline shell
│   ├── css/
│   │   └── style.css              # Estilos responsivos e tema cinematografico
│   └── js/
│       ├── api.js                 # Camada de comunicacao HTTP com a API
│       ├── player.js              # Controlador do player de video e IPTV
│       └── app.js                 # Gerenciador de estado, rotas e interface
├── start.sh                       # Script de inicializacao automatica para Linux
├── .gitignore                     # Protecao estrita de bancos, logs e credenciais
└── README.md                      # Documentacao oficial do projeto
```

---

## Seguranca e Higiene de Dados

O projeto inclui regras estritas no `.gitignore` para assegurar que:
- O banco de dados local (`*.db`, `homeflix.db`) nao e versionado.
- Historico pessoal, progresso de reproducao e dados de familiares permanecem isolados na sua maquina.
- Quem clonar o repositorio comecara com um ambiente limpo e perfis genericos padrao (`Principal` e `Familia`), prontos para personalizacao.

---

## Licenca

Projeto desenvolvido para fins educacionais e de entretenimento pessoal em rede domestica.
