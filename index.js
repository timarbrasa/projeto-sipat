// index.js (Arquivo principal do seu servidor no projeto VideoTest)

// --- Mantenha suas importações e configurações existentes aqui ---
const database = require("./db/db"); // Sua conexão de banco de dados existente
const express = require("express");
const app = express();
const Video = require("./models/Video"); // Seu modelo de vídeo existente

// --- NOVAS importações para o Escape Room ---
const path = require('path');
const { DataTypes } = require('sequelize'); // DataTypes já importado, mas reforçando

// --- Definição do Modelo RankingEntry (para o Escape Room) ---
// O 'sequelize' aqui refere-se à instância de banco de dados que vem do seu './db/db'
// Assumimos que 'database' é sua instância Sequelize
const RankingEntry = database.define('RankingEntry', { // Use 'database' em vez de 'sequelize'
    team: {
        type: DataTypes.STRING,
        allowNull: false
    },
    time: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'RankingEntries' // Nome explícito da tabela para evitar conflitos se necessário
});

// --- Configurações do Express ---
app.use(express.json()); // Habilita o parsing de JSON no corpo das requisições
// O seu projeto VideoTest já deve ter CORS configurado ou não precisar se for apenas local.
// Se precisar, adicione: const cors = require('cors'); app.use(cors());
// Por enquanto, vou manter a importação do cors para garantir compatibilidade com o frontend
const cors = require('cors'); // Importando novamente o cors
app.use(cors()); // Habilita CORS para requisições de diferentes origens

// --- Servir arquivos estáticos do frontend do Escape Room ---
// Isso faz com que os arquivos HTML, CSS, JS e imagens na pasta 'public' sejam acessíveis
app.use(express.static(path.join(__dirname, 'public')));

// Middleware de log para todas as requisições (útil para depuração)
app.use((req, res, next) => {
    console.log(`[Server] Recebida requisição: ${req.method} ${req.url}`);
    next();
});

// --- SEUS ENDPOINTS EXISTENTES DO PROJETO "VideoTest" VÃO AQUI ---
// Por exemplo:
// app.get('/videos', (req, res) => { /* ... sua lógica de vídeos ... */ });
// app.post('/upload', (req, res) => { /* ... sua lógica de vídeos ... */ });

// Exemplo de integração de uma rota de vídeo, se for relevante:
// if (Video) { // Verifica se seu modelo Video foi importado corretamente
//     app.get('/videos', async (req, res) => {
//         try {
//             const videos = await Video.findAll();
//             res.json(videos);
//         } catch (error) {
//             console.error('Erro ao buscar vídeos:', error);
//             res.status(500).send('Erro ao buscar vídeos');
//         }
//     });
// }

// --- ENDPOINTS DO RANKING (integrados aqui) ---

// Endpoint para obter o ranking
app.get('/ranking', async (req, res) => {
    console.log("[Server-Ranking] Requisição GET para /ranking");
    try {
        const ranking = await RankingEntry.findAll({
            order: [['time', 'ASC']], // Ordena por tempo ascendente
            limit: 10 // Limita aos 10 melhores
        });

        console.log("[Server-Ranking] Ranking obtido do DB:", ranking.map(entry => entry.toJSON()));
        res.json(ranking.map(entry => entry.toJSON())); // Converte para JSON puro antes de enviar
    } catch (error) {
        console.error("[Server-Ranking] Erro no endpoint GET /ranking:", error);
        res.status(500).json({ message: "Erro ao obter ranking." });
    }
});

// Endpoint para adicionar um novo resultado ao ranking
app.post('/ranking', async (req, res) => {
    console.log("[Server-Ranking] Requisição POST para /ranking");
    const { team, time } = req.body;
    console.log(`[Server-Ranking] Dados recebidos: Equipe='${team}', Tempo=${time}`);

    if (!team || typeof time === 'undefined') {
        console.error("[Server-Ranking] Dados inválidos recebidos para /ranking: Nome da equipe ou tempo ausente.");
        return res.status(400).json({ message: "Nome da equipe e tempo são obrigatórios." });
    }

    try {
        const newEntry = await RankingEntry.create({ team, time });
        console.log("[Server-Ranking] Nova entrada de ranking criada:", newEntry.toJSON());

        // Lógica para manter apenas os 10 melhores no DB
        const allEntries = await RankingEntry.findAll({ order: [['time', 'ASC']] });
        if (allEntries.length > 10) {
            const entriesToDelete = allEntries.slice(10); // Pega as entradas além das 10 melhores
            await Promise.all(entriesToDelete.map(entry => entry.destroy())); // Deleta
            console.log(`[Server-Ranking] Limpeza do DB: ${entriesToDelete.length} entradas removidas.`);
        }

        res.status(200).json({ message: "Ranking atualizado com sucesso!", entry: newEntry.toJSON() });
    } catch (error) {
        console.error("[Server-Ranking] Erro no endpoint POST /ranking:", error);
        res.status(500).json({ message: "Erro ao adicionar ao ranking." });
    }
});

// --- Rota Principal para servir o HTML do Escape Room ---
// Esta rota deve ser a ÚLTIMA definida, ANTES de app.listen.
// Isso garante que suas rotas de API (ex: /videos, /ranking) sejam verificadas primeiro.
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Sincronizar o Banco de Dados e Iniciar o Servidor ---
try {
    // Sincroniza o banco de dados principal (incluindo o modelo Video e RankingEntry)
    database.sync({ force: false }).then(async () => { // force: false para não apagar dados existentes
        console.log('[DB] Banco de dados principal e modelos sincronizados!');

        // Limpar dados já registrados na tabela RankingEntries
        /*try {
            await RankingEntry.destroy({ where: {}, truncate: true });
            console.log('[DB] Dados da tabela RankingEntries limpos com sucesso!');
        } catch (error) {
            console.error('[DB] Erro ao limpar dados da tabela RankingEntries:', error);
        }*/

        app.listen(9443, () => { // Sua porta original
            console.log('Servidor rodando na porta 9443');
            console.log(`[Server] Acesse seu frontend em: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
        });
    });
} catch (error) {
    console.log('Houve uma falha ao sincronizar o banco de dados principal.', error);
}
