const Fire = require('../models/Fire');

exports.createFire = async (req, res) => {
  try {
    const fire = new Fire(req.body);
    await fire.save();
    res.status(201).json(fire);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getAllFires = async (req, res) => {
  try {
    const fires = await Fire.find();
    res.json(fires);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getFireById = async (req, res) => {
  try {
    const fire = await Fire.findById(req.params.id);
    if (!fire) return res.status(404).json({ message: 'Not found' });
    res.json(fire);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateFire = async (req, res) => {
  try {
    const fire = await Fire.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!fire) return res.status(404).json({ message: 'Not found' });
    res.json(fire);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteFire = async (req, res) => {
  try {
    const fire = await Fire.findByIdAndDelete(req.params.id);
    if (!fire) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
