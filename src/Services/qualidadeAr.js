// Cálculo do índice de qualidade do ar usado no mapa de calor.
//
// EM ABERTO: a fórmula ainda não foi definida. Enquanto isso, calcularIndice()
// devolve null e o mapa responde indice_qualidade: null e categoria: null.
// Quando a fórmula existir, altere apenas calcularIndice() — o resto da API
// (Controller, Model, banco) já entrega as médias de todos os sensores.

const LEGENDA = [
  { categoria: 'Boa', min: 0, max: 50, cor: '#00E400' },
  { categoria: 'Moderada', min: 51, max: 100, cor: '#FFFF00' },
  { categoria: 'Ruim para grupos sensíveis', min: 101, max: 150, cor: '#FF7E00' },
  { categoria: 'Ruim', min: 151, max: 200, cor: '#FF0000' },
  { categoria: 'Muito ruim', min: 201, max: 300, cor: '#8F3F97' },
  { categoria: 'Perigosa', min: 301, max: 500, cor: '#7E0023' },
];

// medias: { temperatura, humidade, pm25, pm10, mq135 }  (valores podem ser null)
// retorno esperado quando implementada: inteiro de 0 a 500
// eslint-disable-next-line no-unused-vars
function calcularIndice(medias) {
  // TODO: implementar o cálculo da qualidade do ar (pm25, pm10 e mq135 são os candidatos)
  return null;
}

function categoriaDoIndice(indice) {
  return LEGENDA.find((faixa) => indice >= faixa.min && indice <= faixa.max)
    || LEGENDA[LEGENDA.length - 1];
}

module.exports = { LEGENDA, calcularIndice, categoriaDoIndice };
