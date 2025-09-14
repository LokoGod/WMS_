const Shelf = require('../models/Shelf');

exports.createShelf = async (req, res) => {
  try {
    const shelf = new Shelf(req.body);
    await shelf.save();
    res.status(201).json(shelf);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getAllShelves = async (req, res) => {
  try {
    const shelves = await Shelf.find();
    res.json(shelves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getShelfById = async (req, res) => {
  try {
    const shelf = await Shelf.findById(req.params.id);
    if (!shelf) return res.status(404).json({ message: 'Not found' });
    res.json(shelf);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateShelf = async (req, res) => {
  try {
    const shelf = await Shelf.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!shelf) return res.status(404).json({ message: 'Not found' });
    res.json(shelf);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteShelf = async (req, res) => {
  try {
    const shelf = await Shelf.findByIdAndDelete(req.params.id);
    if (!shelf) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
