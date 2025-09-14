import React, { useState } from 'react';
import axios from 'axios';
import BASE_URL from '../../config/apiConfig';
import Swal from 'sweetalert2';
import { getToken } from '@/utils/token';

const AddShelfForm = ({ title }) => {
  const [formData, setFormData] = useState({
    shelfNumber: '',
    shelfName: '',
    shelfWidth: '',
    shelfHeigth: '', // <-- keep spelling as API expects
    shelfDepth: '',
    locationX: '',
    locationY: 0, // default to 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const parsed =
      type === 'number'
        ? value === '' ? '' : Math.max(0, Number(value))
        : value;

    setFormData((prev) => ({ ...prev, [name]: parsed }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = getToken();

      const payload = {
        shelfNumber: String(formData.shelfNumber).trim(),
        shelfName: String(formData.shelfName).trim(),
        shelfWidth: Number(formData.shelfWidth || 0),
        shelfHeigth: Number(formData.shelfHeigth || 0),
        shelfDepth: Number(formData.shelfDepth || 0),
        locationX: Number(formData.locationX || 0),
        locationY: Number(formData.locationY || 0),
      };

      if (!payload.shelfNumber || !payload.shelfName) {
        throw new Error('Shelf Number and Shelf Name are required.');
      }

      await axios.post(`${BASE_URL}/shelves`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Swal.fire({
        icon: 'success',
        title: 'Shelf added!',
        text: 'Your shelf was added successfully!',
        timer: 2000,
        showConfirmButton: false,
      });

      setFormData({
        shelfNumber: '',
        shelfName: '',
        shelfWidth: '',
        shelfHeigth: '',
        shelfDepth: '',
        locationX: '',
        locationY: 0,
      });
    } catch (err) {
      console.error('Shelf submission failed:', err?.response?.data || err);
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: err?.response?.data?.message || err.message || 'Failed to add shelf.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {title && <h5 className="mb-3">{title}</h5>}

      <div className="mb-3">
        <label className="form-label">Shelf Number</label>
        <input
          type="text"
          className="form-control"
          name="shelfNumber"
          value={formData.shelfNumber}
          onChange={handleChange}
          required
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Shelf Name</label>
        <input
          type="text"
          className="form-control"
          name="shelfName"
          value={formData.shelfName}
          onChange={handleChange}
          required
        />
      </div>

      <div className="row">
        <div className="col-md-4 mb-3">
          <label className="form-label">Shelf Width</label>
          <input
            type="number"
            className="form-control"
            name="shelfWidth"
            value={formData.shelfWidth}
            onChange={handleChange}
            min="0"
            step="1"
            required
          />
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label">Shelf Heigth</label>
          <input
            type="number"
            className="form-control"
            name="shelfHeigth"
            value={formData.shelfHeigth}
            onChange={handleChange}
            min="0"
            step="1"
            required
          />
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label">Shelf Depth</label>
          <input
            type="number"
            className="form-control"
            name="shelfDepth"
            value={formData.shelfDepth}
            onChange={handleChange}
            min="0"
            step="1"
            required
          />
        </div>
      </div>

      {/* New fields */}
      <div className="row">
        <div className="col-md-6 mb-3">
          <label className="form-label">Location X</label>
          <input
            type="number"
            className="form-control"
            name="locationX"
            value={formData.locationX}
            onChange={handleChange}
            min="0"
            step="1"
          />
        </div>
        <div className="col-md-6 mb-3">
          <label className="form-label">Location Y</label>
          <input
            type="number"
            className="form-control"
            name="locationY"
            value={formData.locationY}
            onChange={handleChange}
            min="0"
            step="1"
          />
        </div>
      </div>

      <div className="d-flex justify-content-end">
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Shelf'}
        </button>
      </div>
    </form>
  );
};

export default AddShelfForm;
