const mongoose = require('mongoose');

const userDailyDetailsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  loggeDateAndTime: { type: Date, required: true },
  shift: { type: String },
  itemPacked: { type: Number },
  itemPicked: { type: Number },
  errors: { type: Number },
  lateChecking: { type: Number }, // 1 or 0
}, { timestamps: true });

module.exports = mongoose.model('UserDailyDetails', userDailyDetailsSchema);
