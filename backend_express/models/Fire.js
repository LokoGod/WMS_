const mongoose = require('mongoose');

const fireSchema = new mongoose.Schema({
  ditectedTime: { type: Date, required: true },
  size: { type: Number },
  distance: { type: Number },
  direction: { type: String },
  status: { type: Number }, // 1 or 0
});

module.exports = mongoose.model('Fire', fireSchema);
