const mongoose = require('mongoose');

const productDetailSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  productDes: { type: String },
  productPrice: { type: Number },
  productSKU: { type: String }
});

module.exports = mongoose.model('ProductDetail', productDetailSchema);
