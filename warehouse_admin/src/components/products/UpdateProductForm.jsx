import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import BASE_URL from '../../config/apiConfig';
import { getToken, getUserId } from '@/utils/token';
import Swal from 'sweetalert2';
import { useParams, useNavigate } from 'react-router-dom';

const UpdateProductForm = ({ title }) => {
  const { id } = useParams(); // product ID from URL
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    productDetailId: '',
    boxWidth: '',
    boxHeigth: '',
    boxDepth: '',
    productQuntity: '',
    boxShelfId: '',
    boxCategoryId: '',
  });

  const [productDetails, setProductDetails] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [catLoading, setCatLoading] = useState(false);

  // NEW: inventory for recommendations + capacity
  const [allProducts, setAllProducts] = useState([]);
  const [loadingInv, setLoadingInv] = useState(false);

  // Fetch supporting data and current product on mount
  useEffect(() => {
    const fetchAll = async () => {
      const token = getToken();
      try {
        // 1. Fetch dropdown data + the product itself
        const [productDetailRes, shelvesRes, productRes] = await Promise.all([
          axios.get(`${BASE_URL}/productDetails`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${BASE_URL}/shelves`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${BASE_URL}/products/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        setProductDetails(productDetailRes.data || []);
        setShelves(shelvesRes.data || []);

        const product = productRes.data;

        // 2. Fetch categories for the product's shelf ID
        const shelfId = product.boxShelfId?._id?.toString() || product.boxShelfId?.toString() || '';
        if (shelfId) {
          try {
            const catRes = await axios.get(`${BASE_URL}/shelfCats/shelf/${shelfId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            setCategories(catRes.data || []);
          } catch {
            setCategories([]);
          }
        } else {
          setCategories([]);
        }

        // 3. Set form with loaded categories
        setFormData({
          productDetailId: product.productDetailId?._id?.toString() || product.productDetailId?.toString() || '',
          boxWidth: product.boxWidth || '',
          boxHeigth: product.boxHeigth || '',
          boxDepth: product.boxDepth || '',
          productQuntity: product.productQuntity || '',
          boxShelfId: shelfId,
          boxCategoryId: product.boxCategoryId?._id?.toString() || product.boxCategoryId?.toString() || '',
        });
      } catch (err) {
        Swal.fire('Error', 'Failed to load data.', 'error');
      }
    };

    const fetchInventory = async () => {
      setLoadingInv(true);
      try {
        const token = getToken();
        const res = await axios.get(`${BASE_URL}/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAllProducts(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        Swal.fire('Error', 'Failed to load product inventory.', 'error');
      } finally {
        setLoadingInv(false);
      }
    };

    fetchAll();
    fetchInventory();
  }, [id]);

  useEffect(() => {
    if (formData.boxShelfId) {
      fetchCategories(formData.boxShelfId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.boxShelfId, shelves.length]);

  const fetchCategories = async (shelfId) => {
    setCatLoading(true);
    try {
      const token = getToken();
      const res = await axios.get(`${BASE_URL}/shelfCats/shelf/${shelfId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(res.data || []);
      if (!res.data?.some((cat) => cat._id === formData.boxCategoryId)) {
        setFormData((prev) => ({ ...prev, boxCategoryId: '' }));
      }
    } catch (err) {
      Swal.fire('Error', 'Failed to load shelf categories.', 'error');
      setCategories([]);
    } finally {
      setCatLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = getToken();
      const userId = getUserId();

      const payload = {
        productDetailId: formData.productDetailId,
        boxWidth: parseFloat(formData.boxWidth),
        boxHeigth: parseFloat(formData.boxHeigth),
        boxDepth: parseFloat(formData.boxDepth),
        boxShelfId: formData.boxShelfId,
        boxCategoryId: formData.boxCategoryId,
        productQuntity: parseInt(formData.productQuntity, 10),
        placedBy: userId,
      };

      await axios.put(`${BASE_URL}/products/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Swal.fire({
        icon: 'success',
        title: 'Product updated!',
        text: 'Your product was updated successfully!',
        timer: 1800,
        showConfirmButton: false,
      });

      navigate('/admin/set-product');
    } catch (err) {
      console.error('Product update failed:', err?.response?.data || err);
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: err?.response?.data?.message || 'Failed to update product.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------- NEW: derived metrics for capacity & recommendation ----------
  // Exclude the currently edited product from occupancy/reco calcs
  const otherProducts = useMemo(
    () => allProducts.filter((p) => (p?._id?.toString?.() || p?._id) !== id),
    [allProducts, id]
  );

  // Map shelfId -> occupied volume
  const shelfOccupancy = useMemo(() => {
    const occ = {};
    for (const s of shelves) {
      occ[s._id] = { shelf: s, occupied: 0 };
    }
    for (const p of otherProducts) {
      const shelfId = p?.boxShelfId?._id || p?.boxShelfId;
      if (!shelfId || !occ[shelfId]) continue;
      const bw = Number(p.boxWidth) || 0;
      const bh = Number(p.boxHeigth) || 0;
      const bd = Number(p.boxDepth) || 0;
      // If you want quantity-aware space, change to:
      // const vol = (bw * bh * bd) * (Number(p.productQuntity) || 0);
      const vol = bw * bh * bd;
      occ[shelfId].occupied += vol;
    }
    return occ;
  }, [otherProducts, shelves]);

  // Available volume per shelf
  const shelfAvailableVolume = useMemo(() => {
    const map = {};
    for (const s of shelves) {
      const capacity = (Number(s.shelfWidth) || 0) * (Number(s.shelfHeigth) || 0) * (Number(s.shelfDepth) || 0);
      const occupied = shelfOccupancy[s._id]?.occupied || 0;
      map[s._id] = Math.max(capacity - occupied, 0);
    }
    return map;
  }, [shelves, shelfOccupancy]);

  // Best shelf: where this product already exists with highest quantity (excluding current row)
  const recommendedShelf = useMemo(() => {
    const pid = formData.productDetailId;
    if (!pid) return null;

    const qtyByShelf = {};
    for (const p of otherProducts) {
      const curPid = p?.productDetailId?._id || p?.productDetailId;
      if (curPid !== pid) continue;
      const shelfId = p?.boxShelfId?._id || p?.boxShelfId;
      if (!shelfId) continue;
      qtyByShelf[shelfId] = (qtyByShelf[shelfId] || 0) + (Number(p.productQuntity) || 0);
    }

    let best = null;
    for (const [shelfId, qty] of Object.entries(qtyByShelf)) {
      const shelf = shelves.find((s) => s._id === shelfId);
      if (!shelf) continue;
      const availableVol = shelfAvailableVolume[shelfId] ?? 0;
      if (!best || qty > best.qty || (qty === best.qty && availableVol > best.availableVol)) {
        best = { shelf, qty, availableVol };
      }
    }
    return best; // or null
  }, [formData.productDetailId, otherProducts, shelves, shelfAvailableVolume]);

  const fmtVol = (n) =>
    typeof n === 'number' && !Number.isNaN(n)
      ? new Intl.NumberFormat().format(Math.floor(n)) + ' cm³'
      : '—';

  const selectedShelfAvailable =
    formData.boxShelfId ? fmtVol(shelfAvailableVolume[formData.boxShelfId]) : '—';

  const topSpaciousShelves = useMemo(() => {
    return shelves
      .map((s) => ({ shelf: s, availableVol: shelfAvailableVolume[s._id] ?? 0 }))
      .sort((a, b) => b.availableVol - a.availableVol)
      .slice(0, 3);
  }, [shelves, shelfAvailableVolume]);

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="form-label">Product</label>
        <select
          className="form-control"
          name="productDetailId"
          value={formData.productDetailId}
          onChange={handleChange}
          required
        >
          <option value="">-- Select Product --</option>
          {productDetails.map((pd) => (
            <option key={pd._id} value={pd._id}>
              {pd.productName}
            </option>
          ))}
        </select>

        {/* Recommendation banner */}
        <div className="form-text mt-2">
          {loadingInv ? (
            <span>Analyzing inventory…</span>
          ) : formData.productDetailId ? (
            recommendedShelf ? (
              <span>
                <strong>Recommended shelf:</strong>{' '}
                <span className="badge bg-success">
                  {recommendedShelf.shelf.shelfNumber} — {recommendedShelf.shelf.shelfName}
                </span>{' '}
                (already stores{' '}
                <strong>{new Intl.NumberFormat().format(recommendedShelf.qty)}</strong> of this
                product; free space: <strong>{fmtVol(recommendedShelf.availableVol)}</strong>)
              </span>
            ) : (
              <span className="text-muted">No recommendation for this product.</span>
            )
          ) : (
            <span className="text-muted">Select a product to get a shelf recommendation.</span>
          )}
        </div>
      </div>

      <div className="row">
        <div className="mb-3 col">
          <label className="form-label">Box Width (cm)</label>
          <input
            type="number"
            className="form-control"
            name="boxWidth"
            value={formData.boxWidth}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
          />
        </div>
        <div className="mb-3 col">
          <label className="form-label">Box Height (cm)</label>
          <input
            type="number"
            className="form-control"
            name="boxHeigth"
            value={formData.boxHeigth}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
          />
        </div>
        <div className="mb-3 col">
          <label className="form-label">Box Depth (cm)</label>
          <input
            type="number"
            className="form-control"
            name="boxDepth"
            value={formData.boxDepth}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div className="mb-3 col">
        <label className="form-label">Product Quantity</label>
        <input
          type="number"
          className="form-control"
          name="productQuntity"
          value={formData.productQuntity}
          onChange={handleChange}
          required
          min="0"
        />
      </div>

      <div className="row">
        <div className="mb-3 col">
          <label className="form-label">Shelf</label>
          <select
            className="form-control"
            name="boxShelfId"
            value={formData.boxShelfId}
            onChange={handleChange}
            required
          >
            <option value="">-- Select Shelf --</option>
            {shelves.map((shelf) => (
              <option key={shelf._id} value={shelf._id}>
                {shelf.shelfNumber} - {shelf.shelfName}
              </option>
            ))}
          </select>

          {/* Capacity / availability panel */}
          <div className="mt-2">
            <div className="alert alert-secondary py-2 mb-2">
              <div className="d-flex flex-wrap align-items-center gap-2">
                <span>
                  <strong>Available volume</strong> (selected shelf):
                </span>
                <span className="badge bg-info text-dark">{selectedShelfAvailable}</span>
              </div>
            </div>

            <div className="small text-muted">
              Top spacious shelves:{' '}
              {topSpaciousShelves.length ? (
                topSpaciousShelves.map(({ shelf, availableVol }, idx) => (
                  <span key={shelf._id} className="me-2">
                    <span className="badge bg-light text-dark">
                      {idx + 1}. {shelf.shelfNumber} ({fmtVol(availableVol)})
                    </span>
                  </span>
                ))
              ) : (
                <em>n/a</em>
              )}
            </div>
          </div>
        </div>

        <div className="mb-3 col">
          <label className="form-label">Shelf Category</label>
          <select
            className="form-control"
            name="boxCategoryId"
            value={formData.boxCategoryId}
            onChange={handleChange}
            required
            disabled={!formData.boxShelfId || catLoading}
          >
            <option value="">
              {catLoading
                ? 'Loading categories...'
                : !formData.boxShelfId
                ? 'Select a shelf first'
                : '-- Select Category --'}
            </option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.shelfCatName} ({cat.shelfCatColor})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="d-flex justify-content-end">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={
            isSubmitting ||
            !formData.productDetailId ||
            !formData.boxShelfId ||
            !formData.boxCategoryId
          }
        >
          {isSubmitting ? 'Saving...' : 'Update Product'}
        </button>
      </div>
    </form>
  );
};

export default UpdateProductForm;
