import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import BASE_URL from '../../config/apiConfig';
import { getToken } from '@/utils/token';

// ---------- small UI helpers ----------
const Loader = () => (
  <div className="d-flex align-items-center gap-2">
    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
    <span>Generating...</span>
  </div>
);
const isGif = (url) => typeof url === 'string' && url.toLowerCase().endsWith('.gif');

// ---------- main component ----------
const PathOptimization = ({ title }) => {
  // raw data
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState('');
  const [boxes, setBoxes] = useState([]); // products placed in shelves (boxes)

  // product selection (unique names)
  const [selectedNames, setSelectedNames] = useState([]);

  // pathfinding params
  const [shelfInterval, setShelfInterval] = useState(2);     // editable (must match backend)
  const [workers, setWorkers] = useState([[2, 2], [5, 0]]); // (row, col) a.k.a. (y, x)

  // generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);

  // -------------------------------- Fetch products in boxes --------------------------------
  useEffect(() => {
    (async () => {
      setLoading(true);
      setLoadErr('');
      try {
        const token = getToken();
        const res = await axios.get(`${BASE_URL}/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = Array.isArray(res.data) ? res.data : [];
        setBoxes(data);
      } catch (e) {
        console.error(e);
        setLoadErr('Failed to load products/boxes.');
      }
      setLoading(false);
    })();
  }, []);

  // -------------------------------- Build unique product list --------------------------------
  const productNames = useMemo(() => {
    const s = new Set();
    for (const b of boxes) {
      const name = b?.productDetailId?.productName;
      if (name) s.add(name);
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [boxes]);

  // -------------------------------- Index shelves and coords --------------------------------
  const shelvesById = useMemo(() => {
    const m = new Map();
    for (const b of boxes) {
      const shelfObj = b?.boxShelfId;
      if (shelfObj?._id) m.set(shelfObj._id, shelfObj);
    }
    return m;
  }, [boxes]);

  // Compute extents from shelf coords
  const { maxX, maxY } = useMemo(() => {
    let mx = 0, my = 0;
    for (const shelf of shelvesById.values()) {
      const x = Number(shelf.locationX) || 0;
      const y = Number(shelf.locationY) || 0;
      if (x > mx) mx = x;
      if (y > my) my = y;
    }
    return { maxX: mx, maxY: my };
  }, [shelvesById]);

  // rows = shelf_height; cols are determined by shelf_count & shelf_interval in backend
  // Backend lays shelf columns at: col = shelf_interval*(i+1) - 1 (i = 0..shelf_count-1)
  // So to cover a DB column index maxX, we need:
  //   shelf_count >= ceil((maxX + 1) / shelf_interval)
  const shelf_count = useMemo(() => {
  let maxIdx = 0;
  for (const s of shelvesById.values()) {
    const idx = Number(s.locationX) || 0;
    if (idx > maxIdx) maxIdx = idx;
  }
  return Math.max(maxIdx, 1);
}, [shelvesById]);

  // Height should at least fit maxY, give a small margin so labels never clip
  const shelf_height = useMemo(() => {
  let my = 0;
  for (const s of shelvesById.values()) {
    const y = Number(s.locationY) || 0;
    if (y > my) my = y;
  }
  return Math.max(my + 2, 3); // small padding so labels don’t clip
}, [shelvesById]);

  // -------------------------------- Build “best shelf per product” --------------------------------
  const bestShelfForProduct = useMemo(() => {
    // map: productName -> { shelfId -> totalQty }
    const agg = new Map();

    for (const b of boxes) {
      const name = b?.productDetailId?.productName;
      const shelfId = b?.boxShelfId?._id || b?.boxCategoryId?.shelfId;
      const qty = Number(b?.productQuntity || 0);
      if (!name || !shelfId) continue;
      if (!agg.has(name)) agg.set(name, new Map());
      const shelfMap = agg.get(name);
      shelfMap.set(shelfId, (shelfMap.get(shelfId) || 0) + qty);
    }

    // reduce to best shelf
    const best = new Map(); // name -> { shelf, shelfId, qty }
    for (const [name, shelfMap] of agg.entries()) {
      let bestShelfId = null;
      let bestQty = -1;
      for (const [shelfId, q] of shelfMap.entries()) {
        if (q > bestQty) {
          bestQty = q;
          bestShelfId = shelfId;
        }
      }
      const shelf = shelvesById.get(bestShelfId) || null;
      if (bestShelfId && shelf) {
        best.set(name, { shelfId: bestShelfId, shelf, qty: bestQty });
      }
    }
    return best;
  }, [boxes, shelvesById]);

  // -------------------------------- Selection results (min shelves) --------------------------------
  const chosenShelves = useMemo(() => {
    // Map shelfId -> { shelf, picks: [{ name, qty }] }
    const m = new Map();
    for (const name of selectedNames) {
      const pick = bestShelfForProduct.get(name);
      if (!pick) continue;
      const { shelfId, shelf, qty } = pick;
      if (!m.has(shelfId)) m.set(shelfId, { shelfId, shelf, picks: [] });
      m.get(shelfId).picks.push({ name, qty });
    }
    // return as array, sorted by (x,y)
    const arr = Array.from(m.values());
    arr.sort((a, b) => {
      const ax = Number(a.shelf.locationX) || 0;
      const ay = Number(a.shelf.locationY) || 0;
      const bx = Number(b.shelf.locationX) || 0;
      const by = Number(b.shelf.locationY) || 0;
      return ax - bx || ay - by;
    });
    return arr;
  }, [selectedNames, bestShelfForProduct]);

  // -------------------------------- picking_locations in (row, col) = (y, x) --------------------------------
  const picking_locations = useMemo(() => {
  const si = Number(shelfInterval) || 2;
  return chosenShelves.map(({ shelf }) => {
    const row = Number(shelf.locationY) || 0;                 // Y stays as-is
    const shelfIndex = Number(shelf.locationX) || 0;          // DB index like 1,2,3...
    const col = si * shelfIndex - 1;                          // map index -> actual grid column
    return [row, col];
  });
}, [chosenShelves, shelfInterval]);

  // -------------------------------- UI: product selection --------------------------------
  const toggleSelectAll = (checked) => {
    setSelectedNames(checked ? productNames : []);
  };

  const toggleName = (name) => {
    setSelectedNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  // -------------------------------- Workers editor --------------------------------
  const addWorker = () => setWorkers((prev) => [...prev, [0, 0]]);
  const removeWorker = (idx) => setWorkers((prev) => prev.filter((_, i) => i !== idx));
  const updateWorker = (idx, dim, value) =>
    setWorkers((prev) =>
      prev.map((w, i) => (i === idx ? [dim === 0 ? Number(value) : w[0], dim === 1 ? Number(value) : w[1]] : w))
    );

  // -------------------------------- Generate path --------------------------------
  const handleGenerate = async () => {
    if (selectedNames.length === 0) {
      Swal.fire('No products', 'Select at least one product.', 'info');
      return;
    }
    if (picking_locations.length === 0) {
      Swal.fire('No shelves found', 'Selected products are not present on any shelf.', 'warning');
      return;
    }
    if (shelf_height <= 0 || shelf_count <= 0) {
      Swal.fire('Map size invalid', 'Check shelf_count / shelf_height data.', 'error');
      return;
    }

    const body = {
      shelf_height: Number(shelf_height),             // rows
      shelf_count: Number(shelf_count),               // number of shelf columns (derived)
      shelf_interval: Number(shelfInterval) || 2,     // MUST match backend grid
      picking_locations,                              // (row, col)
      workers,                                        // (row, col) obstacles
    };

    // console.debug('PATH BODY', body);

    setIsGenerating(true);
    setVideoUrl(null);
    try {
      const res = await axios.post('http://127.0.0.1:5000/pathfinding', body, {
        timeout: 60000,
        headers: { 'Content-Type': 'application/json' },
      });

      const rel = res?.data?.video_url;
      if (rel) {
        const full = rel.startsWith('http') ? rel : `http://127.0.0.1:5000${rel}`;
        setVideoUrl(full);
      }
      Swal.fire({ icon: 'success', title: 'Pathfinding generated!', timer: 1400, showConfirmButton: false });
    } catch (err) {
      console.error('Pathfinding failed:', err?.response?.data || err);
      Swal.fire({
        icon: 'error',
        title: 'Generation failed',
        text: err?.response?.data?.message || 'Could not generate pathfinding.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // -------------------------------- Render --------------------------------
  return (
    <>
      {title && <h5 className="mb-3">{title}</h5>}

      {/* Loader / error */}
      {loading && <div className="text-muted">Loading products…</div>}
      {!loading && loadErr && <div className="text-danger">{loadErr}</div>}

      {/* Config + selection */}
      {!loading && !loadErr && (
        <>
          <div className="row g-3">
            {/* Left: product picker */}
            <div className="col-12 col-lg-6">
              <div className="card">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h6 className="mb-0">Available Products</h6>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="selectAll"
                      checked={selectedNames.length === productNames.length && productNames.length > 0}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="selectAll">Select all</label>
                  </div>
                </div>
                <div className="card-body" style={{ maxHeight: 360, overflow: 'auto' }}>
                  {productNames.length === 0 ? (
                    <div className="text-muted">No products found in boxes.</div>
                  ) : (
                    <div className="row row-cols-1 row-cols-sm-2 g-2">
                      {productNames.map((name) => (
                        <div key={name} className="col">
                          <div className={`border rounded px-2 py-2 d-flex align-items-center justify-content-between ${selectedNames.includes(name) ? 'bg-light' : ''}`}>
                            <span className="small">{name}</span>
                            <input
                              type="checkbox"
                              className="form-check-input ms-2"
                              checked={selectedNames.includes(name)}
                              onChange={() => toggleName(name)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: map params + workers */}
            <div className="col-12 col-lg-6">
              <div className="card mb-3">
                <div className="card-header">
                  <h6 className="mb-0">Map Parameters</h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-sm-4">
                      <label className="form-label">shelf_count (X)</label>
                      <input type="number" className="form-control" value={shelf_count} disabled />
                      <small className="text-muted">Auto from DB X & shelf_interval</small>
                    </div>
                    <div className="col-sm-4">
                      <label className="form-label">shelf_height (Y)</label>
                      <input type="number" className="form-control" value={shelf_height} disabled />
                      <small className="text-muted">Auto from DB Y</small>
                    </div>
                    <div className="col-sm-4">
                      <label className="form-label">shelf_interval</label>
                      <input
                        type="number"
                        className="form-control"
                        value={shelfInterval}
                        min={1}
                        onChange={(e) => {
                          const v = e.target.value === '' ? '' : Math.max(1, Number(e.target.value));
                          setShelfInterval(v);
                        }}
                      />
                      <small className="text-muted">Default 2 (must match backend)</small>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h6 className="mb-0">Stationed Workers/Obstacles (row, col)</h6>
                  <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => setWorkers((prev) => [...prev, [0, 0]])}>
                    + Add
                  </button>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-sm align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>#</th>
                          <th className="text-end">row (y)</th>
                          <th className="text-end">col (x)</th>
                          <th className="text-end">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workers.map((pt, i) => (
                          <tr key={`w-${i}`}>
                            <td>{i + 1}</td>
                            <td style={{ width: 140 }} className="text-end">
                              <input
                                type="number"
                                className="form-control form-control-sm text-end"
                                value={pt[0]}
                                onChange={(e) => updateWorker(i, 0, e.target.value)}
                              />
                            </td>
                            <td style={{ width: 140 }} className="text-end">
                              <input
                                type="number"
                                className="form-control form-control-sm text-end"
                                value={pt[1]}
                                onChange={(e) => updateWorker(i, 1, e.target.value)}
                              />
                            </td>
                            <td className="text-end" style={{ width: 120 }}>
                              <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => removeWorker(i)}>
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                        {workers.length === 0 && (
                          <tr>
                            <td colSpan={4} className="text-center text-muted">No workers.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Selected shelves summary */}
          <div className="card mt-4">
            <div className="card-header">
              <h6 className="mb-0">Selected Shelves & Assignments</h6>
            </div>
            <div className="card-body p-0">
              {selectedNames.length === 0 ? (
                <div className="p-3 text-muted">Select products to compute optimal shelves.</div>
              ) : chosenShelves.length === 0 ? (
                <div className="p-3 text-muted">Selected products are not present on any shelf.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Shelf #</th>
                        <th>Shelf Name</th>
                        <th>X</th>
                        <th>Y</th>
                        <th>Products (best shelf)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chosenShelves.map(({ shelf, picks }) => (
                        <tr key={shelf._id}>
                          <td>{shelf.shelfNumber || '-'}</td>
                          <td>{shelf.shelfName || '-'}</td>
                          <td>{Number(shelf.locationX) || 0}</td>
                          <td>{Number(shelf.locationY) || 0}</td>
                          <td>
                            {picks.map((p) => (
                              <span key={p.name} className="badge text-bg-secondary me-2 mb-1">
                                {p.name} <span className="ms-1">(qty {p.qty})</span>
                              </span>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={5} className="small text-muted">
                          Picking (row,col): [{picking_locations.map(([r, c]) => `${r},${c}`).join('  |  ')}]
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Generate */}
          <div className="d-flex justify-content-end my-3">
            <button
              className="btn btn-success"
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || loading || selectedNames.length === 0}
            >
              {isGenerating ? <Loader /> : 'Generate Path'}
            </button>
          </div>

          {/* Video/GIF result */}
          {videoUrl && (
            <div className="card p-3 mb-4">
              <h6 className="mb-3">Pathfinding Animation</h6>
              <div style={{ display: 'inline-block', maxWidth: '100%' }}>
                {isGif(videoUrl) ? (
                  <img
                    src={videoUrl}
                    alt="Pathfinding animation"
                    style={{ maxWidth: '100%', height: 'auto', borderRadius: 8, display: 'block', margin: '0 auto' }}
                  />
                ) : (
                  <video
                    src={videoUrl}
                    style={{ maxWidth: '100%', height: 'auto', borderRadius: 8, display: 'block', margin: '0 auto' }}
                    autoPlay
                    loop
                    muted
                    controls
                  />
                )}
              </div>
              <small className="text-muted d-block mt-2">{videoUrl}</small>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default PathOptimization;
