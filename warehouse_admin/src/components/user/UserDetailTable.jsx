import React, { useEffect, useMemo, useState } from 'react';
import CardHeader from '@/components/shared/CardHeader';
import CardLoader from '@/components/shared/CardLoader';
import useCardTitleActions from '@/hooks/useCardTitleActions';
import axios from 'axios';
import BASE_URL from '../../config/apiConfig';
import { getToken } from '@/utils/token';
import { BsArrowLeft, BsArrowRight, BsDot, BsSearch, BsX } from 'react-icons/bs';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Button } from 'react-bootstrap';
import { FiCheckCircle } from 'react-icons/fi';

const ALLOWED_TYPES = ['user', 'admin', 'supervisor'];

const UserDetailTable = ({ title }) => {
  const [users, setUsers] = useState([]);
  const [editingRating, setEditingRating] = useState({});
  const [savingRating, setSavingRating] = useState({});
  const { refreshKey, isRemoved, isExpanded, handleRefresh, handleExpand, handleDelete } = useCardTitleActions();

  // NEW: user type inline edit/save state
  const [editingType, setEditingType] = useState({});   // { [userId]: 'user' | 'admin' | 'supervisor' }
  const [savingType, setSavingType] = useState({});     // { [userId]: boolean }

  // NEW: search state
  const [search, setSearch] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchUsers();
  }, [refreshKey]);

  const fetchUsers = async () => {
    try {
      const token = getToken();
      const userRes = await axios.get(`${BASE_URL}/users`, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(Array.isArray(userRes.data) ? userRes.data : []);
    } catch (err) {
      console.error('Failed to load users', err);
    }
  };

  // When select rating in dropdown
  const handleRatingChange = (userId, newRating) => {
    setEditingRating((prev) => ({ ...prev, [userId]: Number(newRating) }));
  };

  // Save rating to backend
  const handleRatingSave = async (user) => {
    const newRating = editingRating[user._id];
    if (newRating == null || newRating === user.supervisorRating) return;
    setSavingRating((prev) => ({ ...prev, [user._id]: true }));

    try {
      const token = getToken();
      await axios.put(
        `${BASE_URL}/users/${user._id}`,
        { supervisorRating: newRating },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Swal.fire({ icon: 'success', title: 'Rating updated', timer: 1200, showConfirmButton: false });
      setEditingRating((prev) => ({ ...prev, [user._id]: undefined }));
      fetchUsers();
    } catch (err) {
      Swal.fire('Error!', 'Failed to update rating.', 'error');
    } finally {
      setSavingRating((prev) => ({ ...prev, [user._id]: false }));
    }
  };

  // ---------- NEW: usertype inline change + save ----------
  const handleTypeChange = async (user, newType) => {
    const normalized = String(newType || '').toLowerCase();
    if (!ALLOWED_TYPES.includes(normalized)) return;

    // Do nothing if unchanged
    const currentType = String(user.usertype || '').toLowerCase();
    if (currentType === normalized) {
      setEditingType((prev) => ({ ...prev, [user._id]: normalized }));
      return;
    }

    // optimistic UI
    setEditingType((prev) => ({ ...prev, [user._id]: normalized }));
    setSavingType((prev) => ({ ...prev, [user._id]: true }));

    try {
      const token = getToken();
      await axios.put(
        `${BASE_URL}/users/${user._id}`,
        { usertype: normalized },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Swal.fire({ icon: 'success', title: 'User type updated', timer: 1000, showConfirmButton: false });
      fetchUsers();
    } catch (err) {
      console.error('Failed to update usertype', err);
      Swal.fire('Error', 'Failed to update user type.', 'error');
      // roll back UI on failure
      setEditingType((prev) => ({ ...prev, [user._id]: currentType }));
    } finally {
      setSavingType((prev) => ({ ...prev, [user._id]: false }));
    }
  };

  if (isRemoved) return null;

  // NEW: filter users (case-insensitive) across relevant fields
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const fields = [
        u?.empid,
        u?.username,
        u?.email,
        u?.phonenumber,
        u?.shift,
        u?.usertype,
        u?.performanceLevel,
        u?.supervisorRating,
      ];
      return fields
        .map((v) => (v === null || v === undefined ? '' : String(v).toLowerCase()))
        .some((text) => text.includes(q));
    });
  }, [users, search]);

  // reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const pretty = (s) => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '');

  return (
    <div className="col-xxl-12">
      <div className={`card stretch stretch-full ${isExpanded ? 'card-expand' : ''} ${refreshKey ? 'card-loading' : ''}`}>
        <CardHeader title={title} refresh={handleRefresh} remove={handleDelete} expanded={handleExpand} />

        {/* Search bar */}
        <div className="px-3 pt-3">
          <div className="d-flex align-items-center gap-2">
            <div className="ms-auto position-relative" style={{ maxWidth: 360, width: '100%' }}>
              <BsSearch size={16} className="position-absolute top-50 translate-middle-y" style={{ left: 12, pointerEvents: 'none' }} />
              <input
                type="text"
                className="form-control ps-5"
                placeholder="Search by Emp ID, name, email, phone, shift, type…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setSearch('');
                }}
                aria-label="Search users"
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
                  <th style={{ display: 'none' }}>ID</th>
                  <th>Emp ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Shift</th>
                  <th>User Type</th>
                  <th>Performance Rating</th>
                  <th>Supervisor Rating</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => {
                  const currentType = String(user.usertype || 'user').toLowerCase();
                  const safeCurrentType = ALLOWED_TYPES.includes(currentType) ? currentType : 'user';
                  const selectValue = editingType[user._id] ?? safeCurrentType;

                  return (
                    <tr key={user._id}>
                      <td style={{ display: 'none' }}>{user._id}</td>
                      {/* NOTE: Username/EmpID order mirrors your current UI; swap if desired */}
                      <td>{user.username}</td>
                      <td>{user.empid}</td>
                      <td>{user.email}</td>
                      <td>{user.phonenumber}</td>
                      <td>{user.shift}</td>

                      {/* NEW: User Type dropdown with auto-save */}
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <select
                            className="form-select form-select-sm"
                            value={selectValue}
                            onChange={(e) => handleTypeChange(user, e.target.value)}
                            disabled={!!savingType[user._id]}
                          >
                            {ALLOWED_TYPES.map((t) => (
                              <option key={t} value={t}>
                                {pretty(t)}
                              </option>
                            ))}
                          </select>
                          {savingType[user._id] && <small className="text-muted">Saving…</small>}
                        </div>
                      </td>

                      <td>{user.performanceLevel}</td>

                      {/* Supervisor Rating (existing) */}
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <select
                            className="form-select form-select-sm"
                            value={
                              editingRating[user._id] !== undefined ? editingRating[user._id] : user.supervisorRating ?? 0
                            }
                            onChange={(e) => handleRatingChange(user._id, e.target.value)}
                          >
                            {[0, 1, 2, 3, 4, 5].map((rate) => (
                              <option key={rate} value={rate}>
                                {rate}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      <td>
                        <Button
                          variant="success"
                          size="sm"
                          disabled={
                            (editingRating[user._id] === undefined || editingRating[user._id] === user.supervisorRating) ||
                            savingRating[user._id]
                          }
                          onClick={() => handleRatingSave(user)}
                        >
                          {savingRating[user._id] ? 'Saving...' : <FiCheckCircle />}
                        </Button>
                      </td>
                    </tr>
                  );
                })}

                {paginatedUsers.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center text-muted py-4">
                      {search ? 'No users match your search.' : 'No users found.'}
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
            Showing {filteredUsers.length ? startIndex + 1 : 0}–{Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length}
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

export default UserDetailTable;
