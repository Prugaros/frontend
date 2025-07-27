import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BrandService from '../services/brand.service';

const BrandForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [brand, setBrand] = useState({ name: '', isActive: true });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      BrandService.get(id)
        .then(response => {
          setBrand(response.data);
          setLoading(false);
        })
        .catch(e => {
          setError(e.response?.data?.message || e.message || "Error fetching brand");
          setLoading(false);
        });
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBrand(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const serviceCall = id ? BrandService.update(id, brand) : BrandService.create(brand);

    serviceCall
      .then(() => {
        navigate('/brands');
      })
      .catch(e => {
        setError(e.response?.data?.message || e.message || "Error saving brand");
        setLoading(false);
      });
  };

  return (
    <div>
      <h2>{id ? 'Edit Brand' : 'Add New Brand'}</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {loading && <p>Loading...</p>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="name" className="form-label">Name</label>
          <input
            type="text"
            className="form-control"
            id="name"
            name="name"
            value={brand.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3 form-check">
          <input
            type="checkbox"
            className="form-check-input"
            id="isActive"
            name="isActive"
            checked={brand.isActive}
            onChange={handleChange}
          />
          <label className="form-check-label" htmlFor="isActive">Active</label>
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  );
};

export default BrandForm;
