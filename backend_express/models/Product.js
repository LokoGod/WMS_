const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productDetailId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductDetail', required: true },
  boxWidth: { type: Number },
  boxHeigth: { type: Number },
  boxDepth: { type: Number },
  boxCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'ShelfCat', required: true },
  boxShelfId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shelf', required: true },
  productQuntity: { type: Number },
  placedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

module.exports = mongoose.model('Product', productSchema);
