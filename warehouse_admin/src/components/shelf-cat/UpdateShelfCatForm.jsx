import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BASE_URL from '../../config/apiConfig';
import Swal from 'sweetalert2';
import { useParams, useNavigate } from 'react-router-dom';
import { getToken } from '@/utils/token';

const UpdateShelfCatForm = () => {
    const { id } = useParams(); // shelfCat ID from URL
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        shelfCatName: '',
        shelfId: '',
        shelfCatColor: '',
    });
    const [shelves, setShelves] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch shelf category and shelves on mount
    useEffect(() => {
        fetchCategory();
        fetchShelves();
        // eslint-disable-next-line
    }, []);

    const fetchCategory = async () => {
        try {
            const token = getToken();
            const res = await axios.get(`${BASE_URL}/shelfCats/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const cat = res.data;
            setFormData({
                shelfCatName: cat.shelfCatName || '',
                shelfId: cat.shelfId?._id || '',
                shelfCatColor: cat.shelfCatColor || '',
            });
        } catch (err) {
            Swal.fire('Error', 'Failed to load shelf category details', 'error');
        }
    };

    const fetchShelves = async () => {
        try {
            const token = getToken();
            const res = await axios.get(`${BASE_URL}/shelves`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShelves(res.data);
        } catch (err) {
            Swal.fire('Error', 'Failed to load shelves.', 'error');
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
            await axios.put(`${BASE_URL}/shelfCats/${id}`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Swal.fire({
                icon: 'success',
                title: 'Category updated!',
                timer: 1800,
                showConfirmButton: false,
            });

            navigate('/admin/shelfcat'); // or wherever your list is
        } catch (err) {
            console.error('Shelf category update failed:', err?.response?.data || err);
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: err?.response?.data?.message || 'Failed to update shelf category.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="mb-3">
                <label className="form-label">Category Name</label>
                <input
                    type="text"
                    className="form-control"
                    name="shelfCatName"
                    value={formData.shelfCatName}
                    onChange={handleChange}
                    required
                />
            </div>
            <div className="mb-3">
                <label className="form-label">Shelf</label>
                <select
                    className="form-control"
                    name="shelfId"
                    value={formData.shelfId}
                    onChange={handleChange}
                    required
                >
                    <option value="">-- Select Shelf --</option>
                    {shelves.map(shelf => (
                        <option key={shelf._id} value={shelf._id}>
                            {shelf.shelfNumber} - {shelf.shelfName}
                        </option>
                    ))}
                </select>
            </div>
            <div className="mb-3">
                <label className="form-label">Category Color</label>
                <input
                    type="text"
                    className="form-control"
                    name="shelfCatColor"
                    value={formData.shelfCatColor}
                    onChange={handleChange}
                    placeholder="e.g., yellow, red, #ff0000"
                    required
                />
            </div>
            <div className="d-flex justify-content-end">
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Update Category'}
                </button>
            </div>
        </form>
    );
};

export default UpdateShelfCatForm;
