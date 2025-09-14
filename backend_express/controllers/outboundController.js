const Outbound = require('../models/Outbound');

exports.createOutbound = async (req, res) => {
  try {
    const outbound = new Outbound(req.body);
    await outbound.save();
    res.status(201).json(outbound);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getAllOutbounds = async (req, res) => {
  try {
    const outbounds = await Outbound.find().populate('productId');
    res.json(outbounds);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOutboundById = async (req, res) => {
  try {
    const outbound = await Outbound.findById(req.params.id).populate('productId');
    if (!outbound) return res.status(404).json({ message: 'Not found' });
    res.json(outbound);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateOutbound = async (req, res) => {
  try {
    const outbound = await Outbound.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!outbound) return res.status(404).json({ message: 'Not found' });
    res.json(outbound);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteOutbound = async (req, res) => {
  try {
    const outbound = await Outbound.findByIdAndDelete(req.params.id);
    if (!outbound) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
