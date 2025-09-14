import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import BASE_URL from '../../config/apiConfig';
import { getToken, getUserId } from '@/utils/token';

import Swal from 'sweetalert2';

const AddProductForm = ({ title }) => {
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

  // NEW: inventory to compute recommendations + capacity
  const [allProducts, setAllProducts] = useState([]);
  const [loadingInv, setLoadingInv] = useState(false);

  useEffect(() => {
    const fetchShelves = async () => {
      try {
        const token = getToken();
        const res = await axios.get(`${BASE_URL}/shelves`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setShelves(res.data || []);
      } catch (err) {
        Swal.fire('Error', 'Failed to load shelves.', 'error');
      }
    };

    const fetchProductDetails = async () => {
      try {
        const token = getToken();
        const res = await axios.get(`${BASE_URL}/productDetails`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProductDetails(res.data || []);
      } catch (err) {
        Swal.fire('Error', 'Failed to load product details.', 'error');
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

    fetchShelves();
    fetchProductDetails();
    fetchInventory();
  }, []);

  useEffect(() => {
    if (!formData.boxShelfId) {
      setCategories([]);
      setFormData((prev) => ({ ...prev, boxCategoryId: '' }));
      return;
    }
    const fetchCategories = async () => {
      setCatLoading(true);
      try {
        const token = getToken();
        const res = await axios.get(
          `${BASE_URL}/shelfCats/shelf/${formData.boxShelfId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
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
    fetchCategories();
  }, [formData.boxShelfId]);

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
      const inboundsPayload = {
        productId: formData.productDetailId,
        date: new Date().toISOString(),
        qty: parseInt(formData.productQuntity, 10),
      };

      await axios.post(`${BASE_URL}/inbounds`, inboundsPayload, {
        headers: { Authorization: `Bearer ${token}` },
      });

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

      await axios.post(`${BASE_URL}/products`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Swal.fire({
        icon: 'success',
        title: 'Product added!',
        text: 'Your product was added successfully!',
        timer: 2000,
        showConfirmButton: false,
      });

      setFormData({
        productDetailId: '',
        boxWidth: '',
        boxHeigth: '',
        boxDepth: '',
        productQuntity: '',
        boxShelfId: '',
        boxCategoryId: '',
      });
    } catch (err) {
      console.error('Product submission failed:', err?.response?.data || err);
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: err?.response?.data?.message || 'Failed to add product.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------- NEW: derived metrics for capacity & recommendation ----------

  // Map shelfId -> { shelf, totalOccupiedVolume }
  const shelfOccupancy = useMemo(() => {
    if (!shelves.length) return {};
    const occ = {};
    // seed with shelves so we can show 0 if empty
    for (const s of shelves) {
      occ[s._id] = {
        shelf: s,
        occupied: 0,
      };
    }
    for (const p of allProducts) {
      const shelfId = p?.boxShelfId?._id || p?.boxShelfId;
      if (!shelfId || !occ[shelfId]) continue;
      const bw = Number(p.boxWidth) || 0;
      const bh = Number(p.boxHeigth) || 0;
      const bd = Number(p.boxDepth) || 0;
      const vol = bw * bh * bd; // assuming one “box” footprint per product record
      occ[shelfId].occupied += vol;
    }
    return occ;
  }, [allProducts, shelves]);

  // Available volume per shelfId
  const shelfAvailableVolume = useMemo(() => {
    const map = {};
    for (const s of shelves) {
      const sw = Number(s.shelfWidth) || 0;
      const sh = Number(s.shelfHeigth) || 0;
      const sd = Number(s.shelfDepth) || 0;
      const capacity = sw * sh * sd;
      const occupied = shelfOccupancy[s._id]?.occupied || 0;
      map[s._id] = Math.max(capacity - occupied, 0);
    }
    return map;
  }, [shelves, shelfOccupancy]);

  // Recommendation: shelf that already has most of the selected product
  const recommendedShelf = useMemo(() => {
    const pid = formData.productDetailId;
    if (!pid) return null;

    // Aggregate quantity by shelf for selected product
    const qtyByShelf = {};
    for (const p of allProducts) {
      const curPid = p?.productDetailId?._id || p?.productDetailId;
      if (curPid !== pid) continue;
      const shelfId = p?.boxShelfId?._id || p?.boxShelfId;
      if (!shelfId) continue;
      qtyByShelf[shelfId] = (qtyByShelf[shelfId] || 0) + (Number(p.productQuntity) || 0);
    }

    // Pick shelf with highest qty; tie-breaker by highest available volume
    let best = null;
    for (const [shelfId, qty] of Object.entries(qtyByShelf)) {
      const record = {
        shelf: shelves.find((s) => s._id === shelfId),
        qty,
        availableVol: shelfAvailableVolume[shelfId] ?? 0,
      };
      if (!record.shelf) continue;
      if (
        !best ||
        record.qty > best.qty ||
        (record.qty === best.qty && record.availableVol > best.availableVol)
      ) {
        best = record;
      }
    }

    return best; // { shelf, qty, availableVol } or null
  }, [formData.productDetailId, allProducts, shelves, shelfAvailableVolume]);

  // Helper format
  const fmtVol = (n) =>
    typeof n === 'number' && !Number.isNaN(n)
      ? new Intl.NumberFormat().format(Math.floor(n)) + ' cm³'
      : '—';

  const selectedShelfAvailable =
    formData.boxShelfId ? fmtVol(shelfAvailableVolume[formData.boxShelfId]) : '—';

  // Also show a quick glance of the top 3 most spacious shelves
  const topSpaciousShelves = useMemo(() => {
    const arr = shelves
      .map((s) => ({
        shelf: s,
        availableVol: shelfAvailableVolume[s._id] ?? 0,
      }))
      .sort((a, b) => b.availableVol - a.availableVol)
      .slice(0, 3);
    return arr;
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
              <span className="text-muted">
                No recommendation: this product isn’t currently stored on any shelf.
              </span>
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
          {isSubmitting ? 'Saving...' : 'Save Product'}
        </button>
      </div>
    </form>
  );
};

export default AddProductForm;
