const mongoose = require('mongoose');

const outboundSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductDetail', required: true },
  date: { type: Date, required: true },
  qty:{ type: Number },
});

module.exports = mongoose.model('Outbound', outboundSchema);
