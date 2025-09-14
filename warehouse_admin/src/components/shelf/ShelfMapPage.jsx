import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import BASE_URL from '../../config/apiConfig';
import { getToken } from '@/utils/token';

const CELL_SIZE = 140;   // px per grid cell (base, pre-zoom)
const GUTTER_LEFT = 48;  // px for Y-axis labels
const GUTTER_TOP  = 40;  // px for X-axis labels
const CELL_PAD = 10;     // inner padding per cell
const TOOLTIP_OFFSET = 12;

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3.0;

const ShelfMapPage = () => {
  const [shelves, setShelves] = useState([]);
  const [loading, setLoading] = useState(true);

  // zoom & hover
  const [zoom, setZoom] = useState(1);
  const [hovered, setHovered] = useState(null); // { shelf, x, y, box }
  const containerRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const token = getToken();
        const res = await axios.get(`${BASE_URL}/shelves`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setShelves(Array.isArray(res.data) ? res.data : []);
      } catch {
        setShelves([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Grid extents
  const maxX = useMemo(() => Math.max(1, ...shelves.map(s => Number(s.locationX) || 1)), [shelves]);
  const maxY = useMemo(() => Math.max(1, ...shelves.map(s => Number(s.locationY) || 1)), [shelves]);

  // Proportional footprint (Width x Depth)
  const maxWidth = useMemo(() => Math.max(1, ...shelves.map(s => Number(s.shelfWidth)  || 0)), [shelves]);
  const maxDepth = useMemo(() => Math.max(1, ...shelves.map(s => Number(s.shelfDepth)  || 0)), [shelves]);
  const maxArea  = useMemo(() => Math.max(1, ...shelves.map(s => (Number(s.shelfWidth)||0)*(Number(s.shelfDepth)||0))), [shelves]);

  // Group shelves by cell (supports multiple shelves at same X/Y)
  const byCell = useMemo(() => {
    const m = new Map();
    for (const s of shelves) {
      const x = Number(s.locationX) || 1;
      const y = Number(s.locationY) || 1;
      const key = `${x}-${y}`;
      if (!m.has(key)) m.set(key, { x, y, items: [] });
      m.get(key).items.push(s);
    }
    return Array.from(m.values());
  }, [shelves]);

  // Color scale by area (green -> yellow -> red)
  const areaToColor = (area) => {
    const t = Math.max(0, Math.min(1, area / maxArea)); // 0..1
    const hue = 120 - 120 * t; // 120=green -> 0=red
    return `hsl(${hue}, 70%, 46%)`;
  };

  // ---------- layout helpers ----------
  const baseWidth = GUTTER_LEFT + maxX * CELL_SIZE;
  const baseHeight = GUTTER_TOP + maxY * CELL_SIZE;

  const outerStyle = {
    position: 'relative',
    borderRadius: 12,
    border: '1px solid #e6e7eb',
    background: '#f7f8fa',
    minHeight: 460,
    overflow: 'auto',
  };

  // Two-layer approach for smooth zoom with correct scrollbars:
  // - sizer: real (zoomed) size to produce proper scrollbars
  // - stage: transformed content at base size
  const sizerStyle = {
    position: 'relative',
    width: Math.round(baseWidth * zoom),
    height: Math.round(baseHeight * zoom),
  };

  const stageStyle = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: baseWidth,
    height: baseHeight,
    transform: `scale(${zoom})`,
    transformOrigin: 'top left',
    background:
      `linear-gradient(to right, rgba(0,0,0,.045) 1px, transparent 1px) 0 0 / ${CELL_SIZE}px ${CELL_SIZE}px,
       linear-gradient(to bottom, rgba(0,0,0,.045) 1px, transparent 1px) 0 0 / ${CELL_SIZE}px ${CELL_SIZE}px`,
  };

  const axisXStyle = (x) => ({
    position: 'absolute',
    left: GUTTER_LEFT + (x - 1) * CELL_SIZE,
    top: 0,
    width: CELL_SIZE,
    height: GUTTER_TOP,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    color: '#6b7280',
    fontWeight: 600,
  });

  const axisYStyle = (y) => ({
    position: 'absolute',
    left: 0,
    top: GUTTER_TOP + (y - 1) * CELL_SIZE,
    width: GUTTER_LEFT,
    height: CELL_SIZE,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    color: '#6b7280',
    fontWeight: 600,
  });

  const cellStyle = (x, y) => ({
    position: 'absolute',
    left: GUTTER_LEFT + (x - 1) * CELL_SIZE,
    top: GUTTER_TOP + (y - 1) * CELL_SIZE,
    width: CELL_SIZE,
    height: CELL_SIZE,
    padding: CELL_PAD,
  });

  // multiple shelves per cell (side-by-side lanes, bottom aligned)
  const laneLayout = (i, n, maxInnerW) => {
    const GAP = 8;
    const laneW = Math.max(24, Math.floor((maxInnerW - GAP * (n - 1)) / n));
    const left = i * (laneW + GAP);
    return { laneW, left };
  };

  const shelfRectStyle = (s, idxInCell, cellCount) => {
    const innerW = CELL_SIZE - CELL_PAD * 2;
    const innerH = CELL_SIZE - CELL_PAD * 2;

    const { laneW, left } = laneLayout(idxInCell, cellCount, innerW);

    const targetW = Math.max(16, Math.round((Number(s.shelfWidth) / maxWidth) * innerW));
    const w = Math.min(targetW, laneW);

    const h = Math.max(10, Math.round((Number(s.shelfDepth) / maxDepth) * (innerH - 14)));
    const x = left + CELL_PAD + Math.round((laneW - w) / 2);
    const y = GUTTER_TOP + (Number(s.locationY) - 1) * CELL_SIZE + (CELL_SIZE - CELL_PAD - h);

    const area = (Number(s.shelfWidth) || 0) * (Number(s.shelfDepth) || 0);
    return {
      position: 'absolute',
      left: GUTTER_LEFT + (Number(s.locationX) - 1) * CELL_SIZE + (x - CELL_PAD),
      top: y,
      width: w,
      height: h,
      background: areaToColor(area),
      border: '1px solid rgba(0,0,0,0.18)',
      borderRadius: 8,
      boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
      transition: 'transform .15s ease, box-shadow .15s ease, filter .15s ease',
      cursor: 'default',
    };
  };

  // Tooltip position (relative to container viewport)
  const tooltipStyle = () => {
    if (!hovered || !containerRef.current) return { display: 'none' };
    const contBox = containerRef.current.getBoundingClientRect();
    const box = hovered.box;
    let left = box.left - contBox.left + containerRef.current.scrollLeft + box.width + TOOLTIP_OFFSET;
    let top  = box.top  - contBox.top  + containerRef.current.scrollTop;

    // keep inside container viewport
    const maxLeft = containerRef.current.scrollLeft + (containerRef.current.clientWidth - 260);
    const maxTop  = containerRef.current.scrollTop  + (containerRef.current.clientHeight - 140);
    left = Math.min(Math.max(left, containerRef.current.scrollLeft + 8), maxLeft);
    top  = Math.min(Math.max(top,  containerRef.current.scrollTop  + 8), maxTop);

    return {
      position: 'absolute',
      left,
      top,
      zIndex: 10,
      width: 240,
      background: '#101827',
      color: '#e5e7eb',
      borderRadius: 10,
      boxShadow: '0 10px 30px rgba(0,0,0,0.30)',
      padding: '12px 14px',
      display: 'block',
      pointerEvents: 'none',
    };
  };

  // format helpers
  const fmt = (v) => (v === null || v === undefined || v === '' ? '-' : String(v));
  const num = (v) => (v || v === 0 ? Number(v) : 0);

  // ---------- zoom handlers ----------
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  const zoomAtPoint = (newZoom, clientX, clientY) => {
    const cont = containerRef.current;
    if (!cont) return setZoom(newZoom);
    const rect = cont.getBoundingClientRect();

    // current mouse position in content coords (pre-zoom)
    const mx = (cont.scrollLeft + (clientX - rect.left)) / zoom;
    const my = (cont.scrollTop  + (clientY - rect.top )) / zoom;

    setZoom((prev) => {
      const z = newZoom;
      // after zoom, keep the point (mx,my) under the cursor
      cont.scrollLeft = mx * z - (clientX - rect.left);
      cont.scrollTop  = my * z - (clientY - rect.top);
      return z;
    });
  };

  const onWheel = (e) => {
    // Pinch zoom on trackpads and Ctrl/Cmd+wheel on mouse
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const direction = e.deltaY > 0 ? -1 : 1;
      const step = 0.1;
      const target = clamp(zoom * (1 + direction * step), ZOOM_MIN, ZOOM_MAX);
      zoomAtPoint(target, e.clientX, e.clientY);
    }
    // else: regular scroll
  };

  const onDoubleClick = (e) => {
    const target = clamp(zoom * 1.2, ZOOM_MIN, ZOOM_MAX);
    zoomAtPoint(target, e.clientX, e.clientY);
  };

  const onKeyDown = (e) => {
    if (!containerRef.current) return;
    if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      zoomAtPoint(clamp(zoom * 1.1, ZOOM_MIN, ZOOM_MAX), containerRef.current.clientWidth / 2, containerRef.current.clientHeight / 2);
    } else if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      zoomAtPoint(clamp(zoom / 1.1, ZOOM_MIN, ZOOM_MAX), containerRef.current.clientWidth / 2, containerRef.current.clientHeight / 2);
    } else if (e.key === '0') {
      e.preventDefault();
      setZoom(1);
      // center scroll roughly
      const cont = containerRef.current;
      cont.scrollLeft = Math.max(0, (Math.round(baseWidth) - cont.clientWidth) / 2);
      cont.scrollTop  = Math.max(0, (Math.round(baseHeight) - cont.clientHeight) / 2);
    }
  };

  return (
    <div className="col-xxl-12">
      <div className="card stretch stretch-full">
        <div className="card-header">
          <h5 className="mb-0">Shelf Location Map</h5>
        </div>

        <div className="card-body">
          {loading ? (
            <div className="text-muted">Loading…</div>
          ) : shelves.length === 0 ? (
            <div className="text-muted">No shelves to display.</div>
          ) : (
            <div
              style={outerStyle}
              ref={containerRef}
              onWheel={onWheel}
              onDoubleClick={onDoubleClick}
              onKeyDown={onKeyDown}
              tabIndex={0} // enables keyboard zoom
            >
              <div style={sizerStyle}>
                <div style={stageStyle}>
                  {/* axes */}
                  {Array.from({ length: maxX }, (_, i) => (
                    <div key={`x-${i+1}`} style={axisXStyle(i + 1)}>X{i + 1}</div>
                  ))}
                  {Array.from({ length: maxY }, (_, i) => (
                    <div key={`y-${i+1}`} style={axisYStyle(i + 1)}>Y{i + 1}</div>
                  ))}

                  {/* grid cells (visual reference) */}
                  {byCell.map(cell => (
                    <div key={`${cell.x}-${cell.y}`} style={cellStyle(cell.x, cell.y)} />
                  ))}

                  {/* shelves */}
                  {byCell.map(cell => {
                    const n = cell.items.length;
                    return cell.items.map((s, i) => {
                      const style = shelfRectStyle(s, i, n);
                      return (
                        <div
                          key={s._id}
                          style={style}
                          onMouseEnter={(e) => {
                            const box = e.currentTarget.getBoundingClientRect();
                            setHovered({ shelf: s, x: cell.x, y: cell.y, box });
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.14)';
                            e.currentTarget.style.filter = 'saturate(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            setHovered(null);
                            e.currentTarget.style.transform = '';
                            e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.08)';
                            e.currentTarget.style.filter = '';
                          }}
                          aria-label="Shelf"
                          role="img"
                        />
                      );
                    });
                  })}
                </div>

                {/* floating tooltip (not scaled) */}
                <div style={tooltipStyle()}>
                  {hovered && (
                    <>
                      <div className="d-flex justify-content-between">
                        <div style={{ fontWeight: 700 }}>
                          {fmt(hovered.shelf.shelfNumber)}
                          <span style={{ color: '#9CA3AF', fontWeight: 500 }}> • {fmt(hovered.shelf.shelfName)}</span>
                        </div>
                        <div style={{ color: '#9CA3AF' }}>X{hovered.x} · Y{hovered.y}</div>
                      </div>
                      <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.35 }}>
                        <div><span style={{ color: '#93C5FD' }}>Width</span>: {fmt(hovered.shelf.shelfWidth)}</div>
                        <div><span style={{ color: '#FDE68A' }}>Depth</span>: {fmt(hovered.shelf.shelfDepth)}</div>
                        <div><span style={{ color: '#FCA5A5' }}>Height</span>: {fmt(hovered.shelf.shelfHeigth)}</div>
                      </div>
                      <hr style={{ borderColor: 'rgba(255,255,255,0.08)', margin: '8px 0' }} />
                      <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                        <div>Footprint: {(num(hovered.shelf.shelfWidth) * num(hovered.shelf.shelfDepth)).toLocaleString()}</div>
                        <div>Volume: {(num(hovered.shelf.shelfWidth) * num(hovered.shelf.shelfDepth) * num(hovered.shelf.shelfHeigth)).toLocaleString()}</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShelfMapPage;
