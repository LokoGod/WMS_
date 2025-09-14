const express = require('express');
const router = express.Router();
const controller = require('../controllers/shelfCatController');
const auth = require('../middleware/auth');

router.post('/', auth, controller.createShelfCat);
router.get('/', auth, controller.getAllShelfCats);
router.get('/:id', auth, controller.getShelfCatById);
router.put('/:id', auth, controller.updateShelfCat);
router.delete('/:id', auth, controller.deleteShelfCat);
router.get('/shelf/:shelfId', auth, controller.getShelfCatByShelfId);


module.exports = router;
