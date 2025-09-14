import React, { useEffect, useState } from 'react';
import axios from 'axios';
import BASE_URL from '../../config/apiConfig';
import { getToken } from '@/utils/token';
import { FiTrendingDown, FiUsers, FiPackage, FiLayers } from 'react-icons/fi';

const LOW_STOCK_THRESHOLD = 1000;

const SiteOverviewStatistics = () => {
  const [stats, setStats] = useState({
    lowStockProducts: 0,
    totalUsers: 0,
    totalProducts: 0,   // productDetails count
    totalShelves: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = getToken();

        // Fetch everything in parallel
        const [productDetailsRes, productsRes, usersRes, shelvesRes] = await Promise.all([
          axios.get(`${BASE_URL}/productDetails`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${BASE_URL}/products`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${BASE_URL}/users`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${BASE_URL}/shelves`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const productDetails = Array.isArray(productDetailsRes.data) ? productDetailsRes.data : [];
        const products = Array.isArray(productsRes.data) ? productsRes.data : [];
        const users = Array.isArray(usersRes.data) ? usersRes.data : [];
        const shelves = Array.isArray(shelvesRes.data) ? shelvesRes.data : [];

        // Aggregate stock by productDetailId (sum of productQuntity across placements)
        const stockByProduct = {};
        for (const p of products) {
          const pdId = p?.productDetailId?._id || p?.productDetailId;
          const qty = Number(p?.productQuntity) || 0;
          if (!pdId) continue;
          stockByProduct[pdId] = (stockByProduct[pdId] || 0) + qty;
        }

        // Count low stock products (< threshold). If a productDetail has no product entries, treat as 0.
        let lowStockCount = 0;
        for (const pd of productDetails) {
          const totalQty = stockByProduct[pd._id] ?? 0;
          if (totalQty < LOW_STOCK_THRESHOLD) lowStockCount += 1;
        }

        setStats({
          lowStockProducts: lowStockCount,
          totalUsers: users.length,
          totalProducts: productDetails.length,
          totalShelves: shelves.length,
        });
      } catch (e) {
        setStats({
          lowStockProducts: 0,
          totalUsers: 0,
          totalProducts: 0,
          totalShelves: 0,
        });
      }
    };

    fetchStats();
  }, []);

  const data = [
    {
      id: 1,
      icon: <FiTrendingDown />,
      title: 'Low Stock Products',
      count: stats.lowStockProducts,
      label: `${stats.lowStockProducts} below ${LOW_STOCK_THRESHOLD}`,
    },
    {
      id: 2,
      icon: <FiUsers />,
      title: 'Users',
      count: stats.totalUsers,
      label: `${stats.totalUsers} User${stats.totalUsers === 1 ? '' : 's'}`,
    },
    {
      id: 3,
      icon: <FiPackage />,
      title: 'Products',
      count: stats.totalProducts,
      label: `${stats.totalProducts} Product${stats.totalProducts === 1 ? '' : 's'}`,
    },
    {
      id: 4,
      icon: <FiLayers />,
      title: 'Shelves',
      count: stats.totalShelves,
      label: `${stats.totalShelves} Shelf${stats.totalShelves === 1 ? '' : 's'}`,
    },
  ];

  return (
    <>
      {data.map(({ id, icon, title, count, label }) => (
        <div key={id} className="col-xxl-3 col-md-6">
          <div className="card stretch stretch-full short-info-card">
            <div className="card-body">
              <div className="d-flex align-items-center gap-3 mb-2">
                <div className="avatar-text avatar-lg bg-gray-200 icon">
                  {React.cloneElement(icon, { size: 24 })}
                </div>
                <div>
                  <div className="fs-2 fw-bold text-dark">{count}</div>
                  <div className="fs-14 fw-semibold text-truncate-1-line">{title}</div>
                </div>
              </div>
              <div className="text-end pt-2">
                <span className="fs-12 text-muted">{label}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default SiteOverviewStatistics;
