const UserDailyDetails = require('../models/UserDailyDetails');

exports.createUserDailyDetails = async (req, res) => {
  try {
    const detail = new UserDailyDetails(req.body);
    await detail.save();
    res.status(201).json(detail);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getAllUserDailyDetails = async (req, res) => {
  try {
    const details = await UserDailyDetails.find().populate('userId', 'username email');
    res.json(details);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserDailyDetailsById = async (req, res) => {
  try {
    const detail = await UserDailyDetails.findById(req.params.id).populate('userId', 'username email');
    if (!detail) return res.status(404).json({ message: 'Not found' });
    res.json(detail);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateUserDailyDetails = async (req, res) => {
  try {
    const detail = await UserDailyDetails.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!detail) return res.status(404).json({ message: 'Not found' });
    res.json(detail);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteUserDailyDetails = async (req, res) => {
  try {
    const detail = await UserDailyDetails.findByIdAndDelete(req.params.id);
    if (!detail) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserDailyDetailsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const details = await UserDailyDetails.find({ userId }).populate('userId').sort({ loggeDateAndTime: -1 });
    res.status(200).json(details);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
