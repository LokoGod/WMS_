const ShelfCat = require('../models/ShelfCat');

exports.createShelfCat = async (req, res) => {
  try {
    const shelfCat = new ShelfCat(req.body);
    await shelfCat.save();
    res.status(201).json(shelfCat);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getAllShelfCats = async (req, res) => {
  try {
    const shelfCats = await ShelfCat.find().populate('shelfId', 'shelfName shelfNumber');
    res.json(shelfCats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getShelfCatById = async (req, res) => {
  try {
    const shelfCat = await ShelfCat.findById(req.params.id).populate('shelfId', 'shelfName shelfNumber');
    if (!shelfCat) return res.status(404).json({ message: 'Not found' });
    res.json(shelfCat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getShelfCatByShelfId = async (req, res) => {
  try {
    const { shelfId } = req.params;
    const shelfCat = await ShelfCat.find({shelfId}).populate('shelfId', 'shelfName shelfNumber');
    if (!shelfCat) return res.status(404).json({ message: 'Not found' });
    res.json(shelfCat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



exports.updateShelfCat = async (req, res) => {
  try {
    const shelfCat = await ShelfCat.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!shelfCat) return res.status(404).json({ message: 'Not found' });
    res.json(shelfCat);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteShelfCat = async (req, res) => {
  try {
    const shelfCat = await ShelfCat.findByIdAndDelete(req.params.id);
    if (!shelfCat) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
