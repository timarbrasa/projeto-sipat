// script.js (Frontend - Interage com o Backend Sequelize/SQLite)

// Seleciona os elementos das diferentes telas
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const adminLoginScreen = document.getElementById('admin-login-screen');
const rankingScreen = document.getElementById('ranking-screen');
const teamNameInput = document.getElementById('team-name');
const startButton = document.getElementById('start-button');
const adminLoginButton = document.getElementById('admin-login-button');

// Carrega o som
const somInicio = new Audio('sounds/startSound.mp3');
const correctAnswerSound = new Audio('sounds/certa.mp3');
const incorrectAnswerSound = new Audio('sounds/errado.mp3');


// Elementos da tela de login
const adminUsernameInput = document.getElementById('admin-username');
const adminPasswordInput = document.getElementById('admin-password');
const loginSubmitButton = document.getElementById('login-submit-button');

// Variáveis de estado do jogo
let currentTeamName = '';
let gameInterval;
let timeLeft = 300; // 5 minutos em segundos (5 minutos = 300 segundos)
let correctPassword = '';
let solvedPuzzles = [false, false, false, false];
let passwordDigits = ['', '', '', ''];

// Novo array para controlar quais dígitos foram revelados e devem ser protegidos
let revealedDigits = [false, false, false, false];

// Elemento visual para a penalidade
const penaltyLight = document.getElementById('penalty-light');

// --- CREDENCIAIS DO ADMINISTRADOR (HARDCODED) ---
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin';

// --- URL BASE DO BACKEND ---
const BACKEND_URL = 'http://localhost:9443'; // Ajuste conforme necessário

// --- Dados dos Enigmas (personalizáveis) ---
const puzzles = [
    {
        id: 'puzzle1',
        question: '🧩 Toda prevenção começa com uma palavra. Monte o quebra-cabeça e descubra o segredo para evitar acidentes. 🧠',
        answer: '1',
        digitIndex: 0
    },
    {
        id: 'puzzle2',
        question: '🧤 Nem todo equipamento está pronto para o jogo. Inspecione os EPIs e descubra qual está fora das regras da segurança. 🕵️',
        answer: '2',
        digitIndex: 1
    },
    {
        id: 'puzzle3',
        question: '⚠️ Um risco escondido pode comprometer toda a equipe. Encontre o perigo e proteja sua rota para a vitória. 🔍',
        answer: '3',
        digitIndex: 2
    },
    {
        id: 'puzzle4',
        question: '🔥 O setor está em chamas! Analise o mapa e escolha a rota que garante a saída segura da equipe. 🚪',
        answer: '4',
        digitIndex: 3
    }
];

// --- Sistema de Ranking (agora gerenciado pelo backend) ---
let ranking = [];

// --- Funções Auxiliares ---

function showScreen(screenToShow) {
    startScreen.classList.remove('active');
    gameScreen.classList.remove('active');
    adminLoginScreen.classList.remove('active');
    rankingScreen.classList.remove('active');
    screenToShow.classList.add('active');
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// --- Lógica da Tela de Início ---

startButton.addEventListener('click', () => {
    currentTeamName = teamNameInput.value.trim();

    if (currentTeamName === '') {
        let message = 'Por favor, digite o nome da sua equipe para iniciar o jogo!';
        showAlert(message);
        return;
    }

    console.log(`[Frontend] Equipe "${currentTeamName}" iniciando o jogo...`);
    initializeGame();
    showScreen(gameScreen);
});

adminLoginButton.addEventListener('click', () => {
    adminUsernameInput.value = '';
    adminPasswordInput.value = '';
    showScreen(adminLoginScreen);
});

// --- Lógica da Tela de Login de Administrador ---

loginSubmitButton.addEventListener('click', () => {
    const username = adminUsernameInput.value.trim();
    const password = adminPasswordInput.value.trim();

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        console.log('Login de Administrador bem-sucedido!');
        fetchRankingAndDisplay();
        showScreen(rankingScreen);
    } else {
        alert('Usuário ou senha incorretos. Tente novamente.');
        adminPasswordInput.value = '';
    }
});

// --- Lógica do Jogo Principal ---

function initializeGame() {
    timeLeft = 300;
    solvedPuzzles = [false, false, false, false];
    passwordDigits = ['', '', '', ''];
    revealedDigits = [false, false, false, false]; // Resetar também ao iniciar

    generateRandomPassword();
    renderGameScreen();
    startTimer();
}

function generateRandomPassword() {
    correctPassword = "2507";
    console.log("[Frontend] Senha fixa definida (para testes e debug):", correctPassword);
}

function renderGameScreen() {
      somInicio.play();
    let puzzlesHTML = puzzles.map((puzzle, index) => `
        <div class="puzzle-box" id="${puzzle.id}">
            <h3>Enigma ${index + 1}</h3>
            <p>${puzzle.question}</p>
            <input type="text" class="puzzle-input" placeholder="Sua resposta...">
            <button class="puzzle-button" data-puzzle-index="${index}">Verificar</button>
            <div class="puzzle-feedback"></div>
        </div>
    `).join('');

    gameScreen.innerHTML = `
        <div class="game-container">
            <div class="timer" id="timer-display">${formatTime(timeLeft)}</div>
            <div id="alertBox"></div>
            <div class="puzzles-area">
                ${puzzlesHTML}
            </div>
            <div class="password-panel">
                <h3>Painel de Saída</h3>
                <p>Insira os 4 dígitos para abrir a porta:</p>
                <div class="password-input-group">
                    <input type="text" class="password-digit-input" id="digit1" maxlength="1" pattern="[0-9]" inputmode="numeric">
                    <input type="text" class="password-digit-input" id="digit2" maxlength="1" pattern="[0-9]" inputmode="numeric">
                    <input type="text" class="password-digit-input" id="digit3" maxlength="1" pattern="[0-9]" inputmode="numeric">
                    <input type="text" class="password-digit-input" id="digit4" maxlength="1" pattern="[0-9]" inputmode="numeric">
                </div>
                <div class="password-display" id="final-password-display">----</div>
                <button class="password-submit-button" id="submit-password-button">Tentar Abrir</button>
            </div>
            <button class="return-button" onclick="endGame(false); showScreen(startScreen);">Voltar à Tela Inicial</button>
        </div>
    `;

    document.querySelectorAll('.puzzle-button').forEach(button => {
        button.addEventListener('click', checkPuzzleAnswer);
    });

    document.getElementById('submit-password-button').addEventListener('click', checkFinalPassword);

    document.querySelectorAll('.password-digit-input').forEach((input, index, array) => {
        input.addEventListener('input', (event) => {
            const value = event.target.value;

            // Protege dígitos já revelados para não serem alterados
            if (revealedDigits[index]) {
                event.target.value = passwordDigits[index];
                return;
            }

            if (!/^\d$/.test(value) && value !== '') {
                event.target.value = '';
                return;
            }

            if (value.length === 1 && index < array.length - 1) {
                array[index + 1].focus();
            }

            passwordDigits[index] = value;
            updateFinalPasswordDisplay();
        });

        input.addEventListener('keydown', (event) => {
            if (event.key === 'Backspace') {
                if (revealedDigits[index]) {
                    // Evita apagar dígitos revelados
                    event.preventDefault();
                    return;
                }

                if (input.value === '' && index > 0) {
                    array[index - 1].focus();
                    passwordDigits[index - 1] = '';
                    updateFinalPasswordDisplay();
                }
            }
        });
    });
}

function startTimer() {
    const losePartySound = new Audio('sounds/losePartySound.mp3')
    const displayElement = document.getElementById('timer-display');
    if (!displayElement) return;

    displayElement.textContent = formatTime(timeLeft);

    clearInterval(gameInterval);
    gameInterval = setInterval(() => {
        timeLeft--;
        displayElement.textContent = formatTime(timeLeft);

        if (timeLeft <= 0) {
            losePartySound.play();
            clearInterval(gameInterval);
            timeLeft = 0;
            let message = 'Tempo esgotado! A segurança é fundamental, mas você não conseguiu escapar a tempo! Obrigado pela participação!';
            showAlert(message);
            endGame(false);
        }
    }, 1000);
}

function applyPenalty() {
    timeLeft = Math.max(0, timeLeft - 15);
    const displayElement = document.getElementById('timer-display');
    if (displayElement) {
        displayElement.textContent = formatTime(timeLeft);
    }

    if (penaltyLight) {
        penaltyLight.style.display = 'block';
        penaltyLight.style.opacity = 0.25;
        setTimeout(() => {
            penaltyLight.style.opacity = 0;
            setTimeout(() => {
                penaltyLight.style.display = 'none';
            }, 200);
        }, 300);
    }
    console.log("[Frontend] Penalidade! -15 segundos.");
}

function checkPuzzleAnswer(event) {
    const button = event.target;
    const puzzleIndex = parseInt(button.dataset.puzzleIndex);
    const puzzleBox = button.closest('.puzzle-box');
    const input = puzzleBox.querySelector('.puzzle-input');
    const feedbackDiv = puzzleBox.querySelector('.puzzle-feedback');

    if (solvedPuzzles[puzzleIndex]) {
        feedbackDiv.textContent = 'Este enigma já foi resolvido!';
        feedbackDiv.className = 'puzzle-feedback correct';
        return;
    }

    const userAnswer = input.value.trim().toLowerCase();
    const correctAnswer = puzzles[puzzleIndex].answer.toLowerCase();

    if (userAnswer === correctAnswer) {
        correctAnswerSound.play();
        feedbackDiv.textContent = 'Correto! Você encontrou um dígito!';
        feedbackDiv.className = 'puzzle-feedback correct';
        solvedPuzzles[puzzleIndex] = true;
        puzzleBox.classList.add('solved');
        input.disabled = true;
        button.disabled = true;

        const digitToReveal = correctPassword[puzzles[puzzleIndex].digitIndex];
        passwordDigits[puzzles[puzzleIndex].digitIndex] = digitToReveal;
        revealedDigits[puzzles[puzzleIndex].digitIndex] = true; // Marca como revelado
        updateFinalPasswordDisplay();
    } else {
        incorrectAnswerSound.play();
        feedbackDiv.textContent = 'Incorreto! Tente novamente.';
        feedbackDiv.className = 'puzzle-feedback incorrect';
        applyPenalty();
    }
}

function updateFinalPasswordDisplay() {
    const display = document.getElementById('final-password-display');
    if (display) {
        display.textContent = passwordDigits.map(digit => digit === '' ? '-' : digit).join('');
    }
}

async function checkFinalPassword() {
    const WinnerSound = new Audio('sounds/ganhou.mp3')
    const enteredPasswordArray = [
        document.getElementById('digit1').value,
        document.getElementById('digit2').value,
        document.getElementById('digit3').value,
        document.getElementById('digit4').value
    ];
    const enteredPassword = enteredPasswordArray.join('');

    const allPuzzlesSolved = solvedPuzzles.every(isSolved => isSolved);

    if (!allPuzzlesSolved) {
        let message = 'Amostradinho, você precisa resolver TODOS os enigmas para obter a senha completa!';
        applyPenalty();
        showAlert(message);
        return;
    }

    if (enteredPassword.length !== 4 || enteredPasswordArray.some(digit => digit === '')) {
        let message = 'Por favor, preencha todos os 4 dígitos da senha!';
        showAlert(message);
        applyPenalty();
        return;
    }

    if (enteredPassword === correctPassword) {
        
        alert('Parabéns, você recebeu a senha para usar no cadeado e escapar com segurança! Obrigado pela participação!');
        WinnerSound.play();
        await delay(5000); // espera 2 segundos
        
        endGame(true);
    } else {
        alert('Senha Incorreta! Tente novamente.');
        applyPenalty();
    }
}

// --- Lógica de Fim de Jogo e Ranking (Atualizada para usar o Backend) ---

async function endGame(isWin) {
    clearInterval(gameInterval);

    if (isWin) {
        const timeSpent = 300 - timeLeft;
        await addScoreToRanking(currentTeamName, timeSpent);
    }

    showScreen(startScreen);
}

function showAlert(message) {
    alert = document.getElementById('alertBox');
    alert.style.display = "flex";
    alert.textContent = message;

    setTimeout(() => {
        alert.style.display = 'none';
    }, 4000);
}

/**
 * Adiciona um novo resultado ao ranking, enviando-o para o backend (Sequelize/SQLite).
 * @param {string} team - O nome da equipe.
 * @param {number} time - O tempo de conclusão em segundos.
 */
async function addScoreToRanking(team, time) {
    console.log(`[Frontend] Tentando salvar ranking: Equipe=${team}, Tempo=${time}`);
    try {
        const response = await fetch(`${BACKEND_URL}/ranking`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ team, time })
        });

        console.log(`[Frontend] Resposta do servidor (status): ${response.status}`);
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Frontend] Erro HTTP ao salvar ranking: Status ${response.status}, Resposta: ${errorText}`);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log("[Frontend] Resultado do POST para ranking (sucesso):", result);

    } catch (error) {
        console.error("[Frontend] Erro no catch ao salvar o ranking no backend:", error);
        alert("Ocorreu um erro ao salvar seu tempo no ranking. Tente novamente mais tarde.");
    }
}

/**
 * Busca o ranking do backend (Sequelize/SQLite) e o exibe na tela.
 */
async function fetchRankingAndDisplay() {
    console.log("[Frontend] Tentando buscar ranking do backend...");
    try {
        const response = await fetch(`${BACKEND_URL}/ranking`);
        console.log(`[Frontend] Resposta do servidor (status): ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Frontend] Erro HTTP ao buscar ranking: Status ${response.status}, Resposta: ${errorText}`);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        ranking = await response.json();
        console.log("[Frontend] Ranking obtido do backend:", ranking);
        updateRankingDisplay();

    } catch (error) {
        console.error("[Frontend] Erro no catch ao buscar ranking do backend:", error);
        alert("Ocorreu um erro ao carregar o ranking. Por favor, tente novamente.");
        ranking = [];
        updateRankingDisplay();
    }
}

function updateRankingDisplay() {
    let rankingHTML = `
        <div class="ranking-container">
            <i class="bi bi-trophy"></i>
            <h1 class="ranking-title">RANKING DE TEMPOS - SIPAT MARBRASA</h1>
            <ol class="ranking-list">
    `;

    for (let i = 0; i < Math.min(ranking.length, 10); i++) {
        const entry = ranking[i];
        rankingHTML += `<li>${entry.team} <span>${formatTime(entry.time)}</span></li>`;
    }

    if (ranking.length === 0) {
        rankingHTML += `<p>Nenhuma equipe no ranking ainda. Seja o primeiro a jogar!</p>`;
    }

    rankingHTML += `
            </ol>
            <button class="return-button" onclick="showScreen(startScreen)">Voltar à Tela Inicial</button>
        </div>
    `;
    rankingScreen.innerHTML = rankingHTML;
}

// --- Inicialização do Jogo ---
showScreen(startScreen);
