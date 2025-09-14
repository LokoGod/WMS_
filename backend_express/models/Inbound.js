const mongoose = require('mongoose');

const inboundSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductDetail', required: true },
  date: { type: Date, required: true },
  qty:{ type: Number },
});

module.exports = mongoose.model('Inbound', inboundSchema);
