const mongoose = require('mongoose');

const shelfSchema = new mongoose.Schema({
  shelfNumber: { type: String, required: true },
  shelfName: { type: String, required: true },
  shelfWidth: { type: Number },
  shelfHeigth: { type: Number },
  shelfDepth: { type: Number },
  locationX: { type: Number,default: 0 },    
  locationY: { type: Number, default: 0 }, 
});

module.exports = mongoose.model('Shelf', shelfSchema);
