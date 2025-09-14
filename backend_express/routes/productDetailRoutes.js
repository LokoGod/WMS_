const express = require('express');
const router = express.Router();
const controller = require('../controllers/productDetailController');
const auth = require('../middleware/auth');

router.post('/', auth, controller.createProductDetails);
router.get('/', auth, controller.getAllProductDetails);
router.get('/:id', auth, controller.getProductDetailById);
router.put('/:id', auth, controller.updateProductDetail);
router.delete('/:id', auth, controller.deleteProductDetail);

module.exports = router;
