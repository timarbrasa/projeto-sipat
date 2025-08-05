// RankingEntry.js
class PlayersResult {
  constructor({ id, team, time, win, createdAt, updatedAt }) {
    this.id = id;
    this.team = team;
    this.time = time;
    this.win = win;
    this.createdAt = new Date(createdAt);
    this.updatedAt = new Date(updatedAt);
  }

  isWinner() {
    return this.win === true;
  }

  toString() {
    return `🏆 Equipe: ${this.team} | Tempo: ${this.time}s | ${this.win ? 'Vitória' : 'Derrota'}`;
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

// Exporta a classe
module.exports = PlayersResult;