const express = require('express');
const router = express.Router();
const controller = require('../controllers/outboundController');
const auth = require('../middleware/auth');

router.post('/', auth, controller.createOutbound);
router.get('/', auth, controller.getAllOutbounds);
router.get('/:id', auth, controller.getOutboundById);
router.put('/:id', auth, controller.updateOutbound);
router.delete('/:id', auth, controller.deleteOutbound);

module.exports = router;
