const mongoose = require('mongoose');

const userLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  loggeDateAndTime: { type: Date, required: true },
  shift: { type: String },
  itemPacked: { type: Number },
  itemPicked: { type: Number },
  errors: { type: Number },
  lateChecking: { type: String }, // 'Yes' or 'No'
  createdDate: { type: Date, default: Date.now },
  month: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('UserLog', userLogSchema);
