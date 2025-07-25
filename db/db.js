//BIBLIOTECA/MODULOS UTILIZADOS
const Sequelize = require( 'sequelize');
//CRIANDO A CONFIGURAÇÃO DO BANCO DE DADOS
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './videoeca/sqlite'
})
//TRATANDO POSSIVEIS ERROS E AUTENTICANDO NO BANCO
try {
  sequelize.authenticate();
  console.log("Bannco de dados conectado com sucesso!");
}
catch (erro) {
  console.log("Erro ao conectar ao banco",erro);
}
module.exports = sequelize;
