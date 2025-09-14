const ProductDetail = require('../models/ProductDetail');

exports.createProductDetails = async (req, res) => {
  try {
    const productdetail = new ProductDetail(req.body);
    await productdetail.save();
    res.status(201).json(productdetail);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getAllProductDetails = async (req, res) => {
  try {
    const products = await ProductDetail.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProductDetailById = async (req, res) => {
  try {
    const productdetail = await ProductDetail.findById(req.params.id);
    if (!productdetail) return res.status(404).json({ message: 'Not found' });
    res.json(productdetail);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProductDetail = async (req, res) => {
  try {
    const productdetail = await ProductDetail.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!productdetail) return res.status(404).json({ message: 'Not found' });
    res.json(productdetail);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteProductDetail = async (req, res) => {
  try {
    const productdetail = await ProductDetail.findByIdAndDelete(req.params.id);
    if (!productdetail) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
