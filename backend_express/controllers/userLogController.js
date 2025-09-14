const UserLog = require('../models/UserLog');

exports.createUserLog = async (req, res) => {
  try {
    const log = new UserLog(req.body);
    await log.save();
    res.status(201).json(log);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getAllUserLogs = async (req, res) => {
  try {
    const logs = await UserLog.find().populate('userId', 'username email');
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserLogById = async (req, res) => {
  try {
    const log = await UserLog.findById(req.params.id).populate('userId', 'username email');
    if (!log) return res.status(404).json({ message: 'Not found' });
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateUserLog = async (req, res) => {
  try {
    const log = await UserLog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!log) return res.status(404).json({ message: 'Not found' });
    res.json(log);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteUserLog = async (req, res) => {
  try {
    const log = await UserLog.findByIdAndDelete(req.params.id);
    if (!log) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserLogsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const logs = await UserLog.find({ userId }).populate('userId', 'username email');
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};