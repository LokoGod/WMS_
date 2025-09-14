import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BASE_URL from '../../config/apiConfig';
import { getToken } from '@/utils/token';
import Swal from 'sweetalert2';
import { useParams, useNavigate } from 'react-router-dom';

const UpdateProductDetailsForm = ({ title }) => {
    const { id } = useParams(); // productDetails ID from URL
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        productName: '',
        productDes: '',
        productPrice: '',
        productSKU: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch current product details on mount
    useEffect(() => {
        fetchProductDetails();
        // eslint-disable-next-line
    }, []);

    const fetchProductDetails = async () => {
        try {
            const token = getToken();
            const res = await axios.get(`${BASE_URL}/productDetails/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const product = res.data;
            setFormData({
                productName: product.productName || '',
                productDes: product.productDes || '',
                productPrice: product.productPrice || '',
                productSKU: product.productSKU || '',
            });
        } catch (err) {
            Swal.fire('Error', 'Failed to load product details', 'error');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const token = getToken();

            const payload = {
                productName: formData.productName,
                productDes: formData.productDes,
                productPrice: parseFloat(formData.productPrice),
                productSKU: formData.productSKU,
            };

            await axios.put(`${BASE_URL}/productDetails/${id}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Swal.fire({
                icon: 'success',
                title: 'Product updated!',
                timer: 1800,
                showConfirmButton: false,
            });

            navigate('/admin/products');
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

    return (
        <form onSubmit={handleSubmit}>
            <div className="mb-3">
                <label className="form-label">Product Name</label>
                <input
                    type="text"
                    className="form-control"
                    name="productName"
                    value={formData.productName}
                    onChange={handleChange}
                    required
                />
            </div>
            <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea
                    className="form-control"
                    name="productDes"
                    value={formData.productDes}
                    onChange={handleChange}
                    required
                />
            </div>
            <div className="mb-3">
                <label className="form-label">Price</label>
                <input
                    type="number"
                    className="form-control"
                    name="productPrice"
                    value={formData.productPrice}
                    onChange={handleChange}
                    required
                />
            </div>
            <div className="mb-3">
                <label className="form-label">SKU</label>
                <input
                    type="text"
                    className="form-control"
                    name="productSKU"
                    value={formData.productSKU}
                    onChange={handleChange}
                    required
                />
            </div>
            <div className="d-flex justify-content-end">
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Saving...' : 'Update Product Detail'}
                </button>
            </div>
        </form>
    );
};

export default UpdateProductDetailsForm;
