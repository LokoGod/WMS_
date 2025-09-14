const express = require('express');
const router = express.Router();
const controller = require('../controllers/inboundController');
const auth = require('../middleware/auth');

router.post('/', auth, controller.createInbound);
router.get('/', auth, controller.getAllInbounds);
router.get('/:id', auth, controller.getInboundById);
router.put('/:id', auth, controller.updateInbound);
router.delete('/:id', auth, controller.deleteInbound);

module.exports = router;
