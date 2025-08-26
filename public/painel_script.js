class PlayersResult {
  constructor({ createdAt,id, team, time, win }) {
    this.createdAt = new Date(createdAt);
    this.id = id;
    this.team = team;
    this.time = time;
    this.win = win;
  }

  isWinner() {
    return this.win === true;
  }

  toString() {
    return `Equipe: ${this.team} | Tempo: ${this.time}s | ${this.win ? 'Vitória' : 'Derrota'}`;
  }

  toJSON() {
    return {
      id: this.id,
      team: this.team,
      time: this.time,
      win: this.win,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function getWinners() {
    try {
        const response = await fetch(`http://localhost:9443/ranking/getWinners`);
        console.log(`[Frontend] Resposta do servidor (status): ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Frontend] Erro HTTP ao buscar ranking: Status ${response.status}, Resposta: ${errorText}`);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const winners = await response.json();
        const players = winners.map(winner => new PlayersResult(winner));

        return players; 

    } catch (error) {
        console.error("[Frontend] Erro no catch ao buscar winners do backend:", error);
    }
}

async function getLosers() {
    console.log("[Frontend] Tentando buscar Losers do backend...");
    try {
        const response = await fetch(`http://localhost:9443/ranking/getLosers`);
        console.log(`[Frontend] Resposta do servidor (status): ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Frontend] Erro HTTP ao buscar ranking: Status ${response.status}, Resposta: ${errorText}`);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const winners = await response.json();

        const losers = winners.map(winner => new PlayersResult(winner));
  
       return losers;

    } catch (error) {
        console.error("[Frontend] Erro no catch ao buscar winners do backend:", error);
    }
}


