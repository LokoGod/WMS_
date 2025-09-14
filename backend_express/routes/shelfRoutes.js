const express = require('express');
const router = express.Router();
const controller = require('../controllers/shelfController');
const auth = require('../middleware/auth');

router.post('/', auth, controller.createShelf);
router.get('/', auth, controller.getAllShelves);
router.get('/:id', auth, controller.getShelfById);
router.put('/:id', auth, controller.updateShelf);
router.delete('/:id', auth, controller.deleteShelf);

module.exports = router;
