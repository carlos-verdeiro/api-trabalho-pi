const { Router } = require('express');
const mobileController = require('../Controllers/mobileController');
const leituraController = require('../Controllers/leituraController');
const { autenticarApp, appOpcional } = require('../Middlewares/auth');

const router = Router();

// Autenticação / dispositivos
router.post('/cadastrar', appOpcional, mobileController.cadastrar);
router.get('/meu', autenticarApp, mobileController.meus);
router.post('/vincular', autenticarApp, mobileController.vincular);
router.delete('/:token_esp/desvincular', autenticarApp, mobileController.desvincular);

// Leituras (as rotas fixas vêm antes das que têm :token_esp)
router.get('/leituras', leituraController.todas);
router.get('/leituras/meus', autenticarApp, leituraController.meus);
router.get('/leituras/:token_esp/ultima', autenticarApp, leituraController.ultima);
router.get('/leituras/:token_esp', autenticarApp, leituraController.doEsp);

// Mapa de calor
router.get('/mapa', leituraController.mapa);

module.exports = router;
