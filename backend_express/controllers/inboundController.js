const Inbound = require('../models/Inbound');

exports.createInbound = async (req, res) => {
  try {
    const inbound = new Inbound(req.body);
    await inbound.save();
    res.status(201).json(inbound);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getAllInbounds = async (req, res) => {
  try {
    const inbounds = await Inbound.find().populate('productId');
    res.json(inbounds);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getInboundById = async (req, res) => {
  try {
    const inbound = await Inbound.findById(req.params.id).populate('productId');
    if (!inbound) return res.status(404).json({ message: 'Not found' });
    res.json(inbound);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateInbound = async (req, res) => {
  try {
    const inbound = await Inbound.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!inbound) return res.status(404).json({ message: 'Not found' });
    res.json(inbound);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteInbound = async (req, res) => {
  try {
    const inbound = await Inbound.findByIdAndDelete(req.params.id);
    if (!inbound) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
