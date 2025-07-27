import React, { useState, useEffect } from 'react';
import CollectionService from '../services/collection.service';
import BrandService from '../services/brand.service';
import { useNavigate, useParams, Link } from 'react-router-dom';

const CollectionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [collection, setCollection] = useState({
    Name: '',
    DisplayOrder: '',
    isActive: true,
    is_featured: false,
    brandId: ''
  });
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    BrandService.getAll()
      .then(response => {
        setBrands(response.data);
        if (id) {
          retrieveCollection(id);
        } else {
          setLoading(false);
        }
      })
      .catch(e => {
        setError(e.response?.data?.message || e.message || "Error fetching brands");
        setLoading(false);
      });
  }, [id]);

  const retrieveCollection = (id) => {
    CollectionService.get(id)
      .then(response => {
        setCollection({
          Name: response.data.Name,
          DisplayOrder: response.data.DisplayOrder || '',
          isActive: response.data.isActive,
          is_featured: response.data.is_featured,
          brandId: response.data.brandId || ''
        });
        setLoading(false);
      })
      .catch(e => {
        setError(e.response?.data?.message || e.message || "Error fetching collection");
        setLoading(false);
      });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCollection(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const saveCollection = () => {
    setLoading(true);
    setError('');

    const data = {
      ...collection,
      DisplayOrder: collection.DisplayOrder === '' ? null : parseInt(collection.DisplayOrder),
    };

    const serviceCall = id ? CollectionService.update(id, data) : CollectionService.create(data);

    serviceCall
      .then(() => {
        navigate('/collections');
      })
      .catch(e => {
        setError(e.response?.data?.message || e.message || "Error saving collection");
        setLoading(false);
      });
  };

  return (
    <div className="container mt-3">
      <h2>{id ? 'Edit Collection' : 'Add Collection'}</h2>

      {error && <div className="alert alert-danger">{error}</div>}
      {loading && <p>Loading...</p>}

      <div className="mb-3">
        <label htmlFor="Name" className="form-label">Name:</label>
        <input
          type="text"
          className="form-control"
          id="Name"
          name="Name"
          required
          value={collection.Name}
          onChange={handleChange}
        />
      </div>

      <div className="mb-3">
        <label htmlFor="brandId" className="form-label">Brand:</label>
        <select
          className="form-control"
          id="brandId"
          name="brandId"
          value={collection.brandId}
          onChange={handleChange}
        >
          <option value="">Select a Brand</option>
          {brands.map(brand => (
            <option key={brand.id} value={brand.id}>{brand.name}</option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label htmlFor="DisplayOrder" className="form-label">Display Order:</label>
        <input
          type="number"
          className="form-control"
          id="DisplayOrder"
          name="DisplayOrder"
          value={collection.DisplayOrder}
          onChange={handleChange}
        />
      </div>

      <div className="mb-3 form-check">
        <input
          type="checkbox"
          className="form-check-input"
          id="isActive"
          name="isActive"
          checked={collection.isActive}
          onChange={handleChange}
        />
        <label className="form-check-label" htmlFor="isActive">Active</label>
      </div>

      <div className="mb-3 form-check">
        <input
          type="checkbox"
          className="form-check-input"
          id="is_featured"
          name="is_featured"
          checked={collection.is_featured}
          onChange={handleChange}
        />
        <label className="form-check-label" htmlFor="is_featured">Featured</label>
      </div>

      <button onClick={saveCollection} className="btn btn-primary" disabled={loading}>
        {loading ? 'Saving...' : 'Save'}
      </button>
      <Link to="/collections" className="btn btn-secondary ms-2">Cancel</Link>
    </div>
  );
};

export default CollectionForm;
