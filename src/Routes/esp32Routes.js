const { Router } = require('express');
const espController = require('../Controllers/espController');
const { autenticarEsp } = require('../Middlewares/auth');

const router = Router();

router.post('/registrar', espController.registrar);
router.post('/leitura', autenticarEsp, espController.enviarLeitura);
router.get('/status', autenticarEsp, espController.status);

module.exports = router;
