const mongoose = require('mongoose');

const shelfCatSchema = new mongoose.Schema({
  shelfCatName: { type: String, required: true },
  shelfId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shelf', required: true },
  shelfCatColor: { type: String },
});

module.exports = mongoose.model('ShelfCat', shelfCatSchema);
