import React, { useState } from 'react';
import axios from 'axios';
import BASE_URL from '../../config/apiConfig';
import { getToken } from '@/utils/token';
import Swal from 'sweetalert2';

const AddProductDetailsForm = ({ title }) => {
    const [formData, setFormData] = useState({
        productName: '',
        productDes: '',
        productPrice: '',
        productSKU: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            // Parse price as a number if needed
            const payload = {
                ...formData,
                productPrice: parseFloat(formData.productPrice)
            };
            await axios.post(`${BASE_URL}/productDetails`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Swal.fire({
                icon: 'success',
                title: 'Product Detail added!',
                text: 'Your product detail was added successfully!',
                timer: 2000,
                showConfirmButton: false,
            });

            setFormData({
                productName: '',
                productDes: '',
                productPrice: '',
                productSKU: '',
            });
        } catch (err) {
            console.error('Product detail submission failed:', err?.response?.data || err);
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: err?.response?.data?.message || 'Failed to add product detail.',
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
                    {isSubmitting ? 'Saving...' : 'Save Product Detail'}
                </button>
            </div>
        </form>
    );
};

export default AddProductDetailsForm;
