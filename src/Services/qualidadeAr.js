// Cálculo do índice de qualidade do ar usado no mapa de calor.
//
// ATENÇÃO: a documentação não define a fórmula, e os sensores atuais só medem
// temperatura e umidade. O cálculo abaixo é um PLACEHOLDER (quanto mais fora da
// faixa ideal, pior o índice). Para usar a fórmula oficial do projeto, altere
// apenas a função calcularIndice() — o resto da API não precisa mudar.

const LEGENDA = [
  { categoria: 'Boa', min: 0, max: 50, cor: '#00E400' },
  { categoria: 'Moderada', min: 51, max: 100, cor: '#FFFF00' },
  { categoria: 'Ruim para grupos sensíveis', min: 101, max: 150, cor: '#FF7E00' },
  { categoria: 'Ruim', min: 151, max: 200, cor: '#FF0000' },
  { categoria: 'Muito ruim', min: 201, max: 300, cor: '#8F3F97' },
  { categoria: 'Perigosa', min: 301, max: 500, cor: '#7E0023' },
];

const TEMPERATURA_IDEAL = [18, 26]; // °C
const HUMIDADE_IDEAL = [40, 60]; // %
const PESO_TEMPERATURA = 10;
const PESO_HUMIDADE = 3;

function desvio(valor, [min, max]) {
  if (valor < min) return min - valor;
  if (valor > max) return valor - max;
  return 0;
}

// medias: { temperatura, humidade }  ->  inteiro de 0 a 500
function calcularIndice(medias) {
  const pontos = desvio(medias.temperatura, TEMPERATURA_IDEAL) * PESO_TEMPERATURA
    + desvio(medias.humidade, HUMIDADE_IDEAL) * PESO_HUMIDADE;
  return Math.min(500, Math.round(pontos));
}

function categoriaDoIndice(indice) {
  return LEGENDA.find((faixa) => indice >= faixa.min && indice <= faixa.max)
    || LEGENDA[LEGENDA.length - 1];
}

module.exports = { LEGENDA, calcularIndice, categoriaDoIndice };
