import React, { useEffect, useMemo, useState } from 'react';
import CardHeader from '@/components/shared/CardHeader';
import CardLoader from '@/components/shared/CardLoader';
import useCardTitleActions from '@/hooks/useCardTitleActions';
import Dropdown from '@/components/shared/Dropdown';
import axios from 'axios';
import BASE_URL from '../../config/apiConfig';
import { BsArrowLeft, BsArrowRight, BsDot, BsSearch, BsX } from 'react-icons/bs';
import { FiEdit3, FiTrash2 } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { getToken } from '@/utils/token';

const ShelfTable = ({ title }) => {
  const navigate = useNavigate();
  const [shelves, setShelves] = useState([]);
  const { refreshKey, isRemoved, isExpanded, handleRefresh, handleExpand, handleDelete } = useCardTitleActions();

  // search state
  const [search, setSearch] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchShelves();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const fetchShelves = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${BASE_URL}/shelves`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShelves(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to load shelves', err);
      Swal.fire('Error', 'Failed to load shelves', 'error');
    }
  };

  const handleDeleteShelf = async (shelfId) => {
    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!',
    });

    if (confirm.isConfirmed) {
      try {
        const token = getToken();
        await axios.delete(`${BASE_URL}/shelves/${shelfId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Swal.fire('Deleted!', 'Shelf has been deleted.', 'success');
        fetchShelves();
      } catch (err) {
        Swal.fire('Error!', 'Failed to delete shelf.', 'error');
      }
    }
  };

  const handleActionClick = (action, shelfId) => {
    if (action === 'Delete') {
      handleDeleteShelf(shelfId);
    } else if (action === 'Edit') {
      navigate(`/admin/shelf/edit/${shelfId}`);
    }
  };

  const getDropdownItems = (shelfId) => [
    {
      icon: <FiEdit3 />,
      label: 'Edit',
      onClick: () => handleActionClick('Edit', shelfId),
    },
    { type: 'divider' },
    {
      icon: <FiTrash2 />,
      label: 'Delete',
      onClick: () => handleActionClick('Delete', shelfId),
    },
  ];

  const fmt = (v) =>
    typeof v === 'number'
      ? v.toLocaleString()
      : v === null || v === undefined || v === ''
      ? '-'
      : String(v);

  if (isRemoved) return null;

  // derived filtered list (case-insensitive) — now includes locationX/locationY
  const filteredShelves = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return shelves;
    return shelves.filter((s) => {
      const fields = [
        s?.shelfNumber,
        s?.shelfName,
        s?.shelfWidth,
        s?.shelfHeigth, // backend spelling
        s?.shelfDepth,
        s?.locationX,
        s?.locationY,
      ];
      return fields
        .map((v) => (v === null || v === undefined ? '' : String(v).toLowerCase()))
        .some((text) => text.includes(q));
    });
  }, [shelves, search]);

  // Reset to first page whenever search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filteredShelves.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedShelves = filteredShelves.slice(startIndex, endIndex);

  return (
    <div className="col-xxl-12">
      <div
        className={`card stretch stretch-full ${isExpanded ? 'card-expand' : ''} ${refreshKey ? 'card-loading' : ''}`}
      >
        <CardHeader
          title={title || 'All Shelves'}
          refresh={handleRefresh}
          remove={handleDelete}
          expanded={handleExpand}
        />

        {/* Search bar */}
        <div className="px-3 pt-3">
          <div className="d-flex align-items-center gap-2">
            <div className="ms-auto position-relative" style={{ maxWidth: 340, width: '100%' }}>
              <BsSearch
                size={16}
                className="position-absolute top-50 translate-middle-y"
                style={{ left: 12, pointerEvents: 'none' }}
              />
              <input
                type="text"
                className="form-control ps-5"
                placeholder="Search by number, name, size or location…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setSearch('');
                }}
                aria-label="Search shelves"
              />
              {search && (
                <button
                  type="button"
                  className="btn btn-sm btn-link position-absolute top-50 translate-middle-y"
                  style={{ right: 4 }}
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                >
                  <BsX size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="card-body custom-card-action p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Shelf Number</th>
                  <th>Shelf Name</th>
                  <th className="text-end">Width</th>
                  <th className="text-end">Heigth</th>
                  <th className="text-end">Depth</th>
                  <th className="text-end">Location X</th>
                  <th className="text-end">Location Y</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedShelves.map((shelf, idx) => (
                  <tr key={shelf._id}>
                    <td>{startIndex + idx + 1}</td>
                    <td>{fmt(shelf.shelfNumber)}</td>
                    <td>{fmt(shelf.shelfName)}</td>
                    <td className="text-end">{fmt(shelf.shelfWidth)}</td>
                    <td className="text-end">{fmt(shelf.shelfHeigth)}</td>
                    <td className="text-end">{fmt(shelf.shelfDepth)}</td>
                    <td className="text-end">{fmt(shelf.locationX ?? 0)}</td>
                    <td className="text-end">{fmt(shelf.locationY ?? 0)}</td>
                    <td className="text-end">
                      <Dropdown
                        dropdownItems={getDropdownItems(shelf._id)}
                        triggerClass="avatar-md ms-auto"
                        triggerPosition="0,28"
                      />
                    </td>
                  </tr>
                ))}
                {paginatedShelves.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center text-muted py-4">
                      {search ? 'No shelves match your search.' : 'No shelves found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer with pagination + count */}
        <div className="card-footer d-flex align-items-center justify-content-between">
          <div className="text-muted small">
            Showing {filteredShelves.length ? startIndex + 1 : 0}–
            {Math.min(endIndex, filteredShelves.length)} of {filteredShelves.length}
          </div>

          <ul className="list-unstyled d-flex align-items-center gap-2 mb-0 pagination-common-style">
            <li>
              <Link
                to="#"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className={currentPage === 1 ? 'disabled' : ''}
              >
                <BsArrowLeft size={16} />
              </Link>
            </li>
            {Array.from({ length: totalPages }, (_, index) => {
              const page = index + 1;
              const shouldShow = page === 1 || page === totalPages || Math.abs(currentPage - page) <= 1;
              if (!shouldShow && (page === 2 || page === totalPages - 1)) {
                return (
                  <li key={`dots-${index}`}>
                    <Link to="#" onClick={(e) => e.preventDefault()}>
                      <BsDot size={16} />
                    </Link>
                  </li>
                );
              }
              return shouldShow ? (
                <li key={index}>
                  <Link to="#" onClick={() => setCurrentPage(page)} className={currentPage === page ? 'active' : ''}>
                    {page}
                  </Link>
                </li>
              ) : null;
            })}
            <li>
              <Link
                to="#"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className={currentPage === totalPages ? 'disabled' : ''}
              >
                <BsArrowRight size={16} />
              </Link>
            </li>
          </ul>
        </div>

        <CardLoader refreshKey={refreshKey} />
      </div>
    </div>
  );
};

export default ShelfTable;
