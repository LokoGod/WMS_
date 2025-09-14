const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  empid: { type: String, required: true },
  faceImgUrl: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phonenumber: { type: String },
  dob: { type: Date },
  address: { type: String },
  nic: { type: String },
  performanceLevel: { type: String },
  usertype: { type: String },
  shift: { type: String },
  supervisorRating: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
