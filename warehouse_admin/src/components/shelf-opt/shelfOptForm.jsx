import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import BASE_URL from '../../config/apiConfig';
import Swal from 'sweetalert2';
import { getToken } from '@/utils/token';

const Loader = () => (
  <div className="d-flex align-items-center gap-2">
    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
    <span>Generating...</span>
  </div>
);

const ShelfOptfForm = ({ title }) => {
  const [shelves, setShelves] = useState([]);
  const [selectedShelfId, setSelectedShelfId] = useState('');
  const [shelfCats, setShelfCats] = useState([]);
  const [products, setProducts] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [freeSpaceByCat, setFreeSpaceByCat] = useState(null); 
  const [videoUrl, setVideoUrl] = useState(null); // <-- animated layout preview

  // Load shelves on mount
  useEffect(() => {
    (async () => {
      try {
        const token = getToken();
        const res = await axios.get(`${BASE_URL}/shelves`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setShelves(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to load shelves:', err?.response?.data || err);
        Swal.fire('Error', 'Failed to load shelves', 'error');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When a shelf is selected: fetch shelf categories + all products
  useEffect(() => {
    if (!selectedShelfId) return;

    (async () => {
      const token = getToken();
      try {
        // shelf categories for that shelf
        const catRes = await axios.get(`${BASE_URL}/shelfCats/shelf/${selectedShelfId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setShelfCats(Array.isArray(catRes.data) ? catRes.data : []);
      } catch (err) {
        console.error('Failed to load shelf categories:', err?.response?.data || err);
        setShelfCats([]);
        Swal.fire('Error', 'Failed to load shelf categories', 'error');
      }

      try {
        // all products
        const prodRes = await axios.get(`${BASE_URL}/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
      } catch (err) {
        console.error('Failed to load products:', err?.response?.data || err);
        setProducts([]);
        Swal.fire('Error', 'Failed to load products', 'error');
      }
    })();
  }, [selectedShelfId]);

  // Find the selected shelf obj
  const selectedShelf = useMemo(
    () => shelves.find((s) => s._id === selectedShelfId) || null,
    [shelves, selectedShelfId]
  );

  // Products filtered to this shelf
  const shelfProducts = useMemo(() => {
    if (!selectedShelfId || !products?.length) return [];
    return products.filter((p) => p?.boxShelfId?._id === selectedShelfId);
  }, [products, selectedShelfId]);

  // Helper: volume
  const volume = (w, h, d) => Number(w || 0) * Number(h || 0) * Number(d || 0);

  // Build items payload for /generate
  const itemsPayload = useMemo(() => {
    return shelfProducts.map((p) => {
      const w = Number(p.boxWidth || 0);
      const h = Number(p.boxHeigth || 0);
      const d = Number(p.boxDepth || 0);
      const catName = p?.boxCategoryId?.shelfCatName || 'normal';
      const catColor = p?.boxCategoryId?.shelfCatColor || 'gray';
      return [w, h, d, catName, catColor];
    });
  }, [shelfProducts]);

  // Build compatibility rules from the shelf's categories: { name: [name] }
  const buildCompatibilityRules = (cats) => {
    const rules = {};
    cats.forEach((c) => {
      const name = c?.shelfCatName;
      if (name) rules[name] = [name];
    });
    return rules;
  };

  const handleGenerate = async () => {
    if (!selectedShelf) {
      Swal.fire('Select a shelf', 'Please select a shelf first.', 'info');
      return;
    }
    if (!shelfCats.length) {
      Swal.fire('No categories', 'No shelf categories found for this shelf.', 'info');
      return;
    }

    const body = {
      shelf_width: Number(selectedShelf.shelfWidth || 0),
      shelf_height: Number(selectedShelf.shelfHeigth || 0),
      shelf_depth: Number(selectedShelf.shelfDepth || 0),
      shelf_count: shelfCats.length,
      selected_shelf_id: null,
      compatibility_rules: buildCompatibilityRules(shelfCats),
      items: itemsPayload,
    };

    setIsGenerating(true);
    setFreeSpaceByCat(null);
    setVideoUrl(null);

    try {
      // If CORS bites, use a Vite proxy and call '/generate' instead
      const res = await axios.post(`http://127.0.0.1:5000/generate`, body);

      // Try extract a video_url if backend returns it
      let rel = res?.data?.video_url || res?.data?.video || res?.data?.gif_url;
      if (!rel && Array.isArray(res.data)) {
        // Sometimes the API returns array + meta in headers or first element
        rel = res.data[0]?.video_url || res.data.video_url;
      }
      if (rel) {
        const full = rel.startsWith('http') ? rel : `http://127.0.0.1:5000${rel}`;
        setVideoUrl(full);
      }

      // Compute free-space per category (even-split heuristic)
      const totalShelfVol = volume(body.shelf_width, body.shelf_height, body.shelf_depth);
      const perCatBudget = shelfCats.length > 0 ? totalShelfVol / shelfCats.length : 0;

      // Sum used volume by category from API response (same shape as your sample)
      const resultItems = Array.isArray(res.data) ? res.data : [];
      const usedByCat = {};
      resultItems.forEach((it) => {
        const cat = it?.boxCategoryId?.shelfCatName || 'unknown';
        usedByCat[cat] = (usedByCat[cat] || 0) + volume(it.boxWidth, it.boxHeigth, it.boxDepth);
      });

      const free = {};
      shelfCats.forEach((cat) => {
        const name = cat.shelfCatName;
        free[name] = Math.max(0, perCatBudget - (usedByCat[name] || 0));
      });

      setFreeSpaceByCat(free);

      Swal.fire({
        icon: 'success',
        title: 'Plan generated!',
        html: `
          <div style="text-align:left">
            <p><b>Shelf:</b> ${selectedShelf.shelfNumber} - ${selectedShelf.shelfName}</p>
            <p><b>Products considered:</b> ${itemsPayload.length}</p>
            <p><b>Categories:</b> ${shelfCats.map((c) => c.shelfCatName).join(', ')}</p>
          </div>
        `,
        timer: 1700,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error('Generate failed:', err?.response?.data || err);
      Swal.fire({
        icon: 'error',
        title: 'Generation failed',
        text: err?.response?.data?.message || 'Could not generate plan.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const isGif = (url) => typeof url === 'string' && url.toLowerCase().endsWith('.gif');

  return (
    <>
      {title && <h5 className="mb-3">{title}</h5>}

      {/* Shelf selector */}
      <div className="mb-3">
        <label className="form-label">Select Shelf</label>
        <select
          className="form-select"
          value={selectedShelfId}
          onChange={(e) => setSelectedShelfId(e.target.value)}
        >
          <option value="">-- Select a shelf --</option>
          {shelves.map((s) => (
            <option key={s._id} value={s._id}>
              {s.shelfNumber} — {s.shelfName} (W:{s.shelfWidth}, H:{s.shelfHeigth}, D:{s.shelfDepth})
            </option>
          ))}
        </select>
      </div>

      {/* Categories preview */}
      {selectedShelfId && (
        <div className="mb-3">
          <label className="form-label">Categories for this shelf</label>
          <div className="d-flex flex-wrap gap-2">
            {shelfCats.length ? (
              shelfCats.map((c) => (
                <span
                  key={c._id}
                  className="badge"
                  style={{
                    background: c.shelfCatColor || '#6c757d',
                    color: '#fff',
                    padding: '0.5rem 0.75rem',
                  }}
                >
                  {c.shelfCatName}
                </span>
              ))
            ) : (
              <span className="text-muted">No categories</span>
            )}
          </div>
        </div>
      )}

      {/* Generate button */}
      <div className="d-flex justify-content-end mb-4">
        <button
          type="button"
          className="btn btn-success"
          onClick={handleGenerate}
          disabled={!selectedShelfId || isGenerating}
        >
          {isGenerating ? <Loader /> : 'Generate Plan'}
        </button>
      </div>

      {/* Animated layout preview (GIF/Video) */}
      {videoUrl && (
        <div className="card p-3 mb-4">
          <h6 className="mb-3">Layout Animation</h6>
          {isGif(videoUrl) ? (
            <img src={videoUrl} alt="Shelf layout animation" style={{ maxWidth: '100%', borderRadius: 8 }} />
          ) : (
            <video
              src={videoUrl}
              style={{ width: '100%', borderRadius: 8 }}
              autoPlay
              loop
              muted
              controls
            />
          )}
          <small className="text-muted d-block mt-2">{videoUrl}</small>
        </div>
      )}

      {/* Free space per category (approx.) */}
      {freeSpaceByCat && (
        <div className="card p-3">
          <h6 className="mb-3">Free Space by Category (approx.)</h6>
          <div className="row">
            {Object.entries(freeSpaceByCat).map(([cat, free]) => (
              <div className="col-md-4 mb-2" key={cat}>
                <div className="d-flex justify-content-between align-items-center border rounded p-2">
                  <strong>{cat}</strong>
                  <span className="badge bg-info">
                    {free.toLocaleString()} (vol units)
                  </span>
                </div>
              </div>
            ))}
          </div>
          <small className="text-muted">
            *Heuristic: evenly splits shelf volume across categories, minus used volume from /generate response.
          </small>
        </div>
      )}
    </>
  );
};

export default ShelfOptfForm;
