const express = require('express');
const router = express.Router();
const controller = require('../controllers/fireController');
const auth = require('../middleware/auth');

router.post('/', auth, controller.createFire);
router.get('/', auth, controller.getAllFires);
router.get('/:id', auth, controller.getFireById);
router.put('/:id', auth, controller.updateFire);
router.delete('/:id', auth, controller.deleteFire);

module.exports = router;
