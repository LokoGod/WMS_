import React, { useEffect, useMemo, useState } from 'react';
import CardHeader from '@/components/shared/CardHeader';
import CardLoader from '@/components/shared/CardLoader';
import useCardTitleActions from '@/hooks/useCardTitleActions';
import Dropdown from '@/components/shared/Dropdown';
import axios from 'axios';
import BASE_URL from '../../config/apiConfig';
import { getToken } from '@/utils/token';
import { BsArrowLeft, BsArrowRight, BsDot, BsSearch, BsX } from 'react-icons/bs';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FiEdit3, FiTrash2 } from 'react-icons/fi';

const ProductDetailsTable = ({ title }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const { refreshKey, isRemoved, isExpanded, handleRefresh, handleExpand, handleDelete } = useCardTitleActions();

  // NEW: search state
  const [search, setSearch] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line
  }, [refreshKey]);

  const fetchProducts = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${BASE_URL}/productDetails`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to load product details', err);
    }
  };

  const handleDeleteProduct = async (productId) => {
    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!'
    });

    if (confirm.isConfirmed) {
      try {
        const token = getToken();
        await axios.delete(`${BASE_URL}/productDetails/${productId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        Swal.fire('Deleted!', 'Product has been deleted.', 'success');
        fetchProducts();
      } catch (err) {
        Swal.fire('Error!', 'Failed to delete product.', 'error');
      }
    }
  };

  const handleActionClick = (action, productId) => {
    if (action === 'Delete') {
      handleDeleteProduct(productId);
    } else if (action === 'Edit') {
      navigate(`/admin/product/edit/${productId}`);
    }
  };

  const getDropdownItems = (productId) => [
    { icon: <FiEdit3 />, label: 'Edit', onClick: () => handleActionClick('Edit', productId) },
    { type: 'divider' },
    { icon: <FiTrash2 />, label: 'Delete', onClick: () => handleActionClick('Delete', productId) }
  ];

  if (isRemoved) return null;

  // NEW: filter products (case-insensitive)
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const fields = [
        p?.productName,
        p?.productDes,
        p?.productPrice,
        p?.productSKU
      ];
      return fields
        .map((v) => (v === null || v === undefined ? '' : String(v).toLowerCase()))
        .some((text) => text.includes(q));
    });
  }, [products, search]);

  // NEW: reset to first page on search change
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  return (
    <div className="col-xxl-12">
      <div className={`card stretch stretch-full ${isExpanded ? 'card-expand' : ''} ${refreshKey ? 'card-loading' : ''}`}>
        <CardHeader title={title || 'All Product Details'} refresh={handleRefresh} remove={handleDelete} expanded={handleExpand} />

        {/* NEW: Search bar */}
        <div className="px-3 pt-3">
          <div className="d-flex align-items-center gap-2">
            <div className="ms-auto position-relative" style={{ maxWidth: 360, width: '100%' }}>
              <BsSearch size={16} className="position-absolute top-50 translate-middle-y" style={{ left: 12, pointerEvents: 'none' }} />
              <input
                type="text"
                className="form-control ps-5"
                placeholder="Search by name, description, price, SKU…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setSearch('');
                }}
                aria-label="Search products"
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
                  <th>Product Name</th>
                  <th>Description</th>
                  <th>Price</th>
                  <th>SKU</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((product, idx) => (
                  <tr key={product._id}>
                    <td>{startIndex + idx + 1}</td>
                    <td>{product.productName}</td>
                    <td>{product.productDes}</td>
                    <td>{product.productPrice}</td>
                    <td>{product.productSKU}</td>
                    <td className="text-end">
                      <Dropdown
                        dropdownItems={getDropdownItems(product._id)}
                        triggerClass="avatar-md ms-auto"
                        triggerPosition="0,28"
                      />
                    </td>
                  </tr>
                ))}

                {paginatedProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-4">
                      {search ? 'No products match your search.' : 'No products found.'}
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
            Showing {filteredProducts.length ? startIndex + 1 : 0}–
            {Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length}
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

export default ProductDetailsTable;
