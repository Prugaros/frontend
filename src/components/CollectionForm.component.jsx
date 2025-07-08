import React, { useState, useEffect } from 'react';
import CollectionService from '../services/collection.service';
import { useNavigate, useParams, Link } from 'react-router-dom';

const CollectionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [Name, setName] = useState('');
  const [DisplayOrder, setDisplayOrder] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      retrieveCollection(id);
    }
  }, [id]);

  const retrieveCollection = (id) => {
    setLoading(true);
    setError('');

    CollectionService.get(id)
      .then(response => {
        const collection = response.data;
        setName(collection.Name);
        setDisplayOrder(collection.DisplayOrder || '');
        setIsActive(collection.isActive);
        setLoading(false);
      })
      .catch(e => {
        setError(e.response?.data?.message || e.message || "Error fetching collection");
        console.error(e);
        setLoading(false);
      });
  };

  const saveCollection = () => {
    setLoading(true);
    setError('');

    const data = {
      Name: Name,
      DisplayOrder: DisplayOrder === '' ? null : parseInt(DisplayOrder),
      isActive: isActive
    };

    if (id) {
      CollectionService.update(id, data)
        .then(() => {
          setLoading(false);
          navigate('/collections');
        })
        .catch(e => {
          setError(e.response?.data?.message || e.message || `Error updating collection ${id}`);
          console.error(e);
          setLoading(false);
        });
    } else {
      CollectionService.create(data)
        .then(() => {
          setLoading(false);
          navigate('/collections');
        })
        .catch(e => {
          setError(e.response?.data?.message || e.message || "Error creating collection");
          console.error(e);
          setLoading(false);
        });
    }
  };

  return (
    <div className="container mt-3">
      <h2>{id ? 'Edit Collection' : 'Add Collection'}</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="mb-3">
        <label htmlFor="Name" className="form-label">Name:</label>
        <input
          type="text"
          className="form-control"
          id="Name"
          required
          value={Name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label htmlFor="DisplayOrder" className="form-label">Display Order:</label>
        <input
          type="number"
          className="form-control"
          id="DisplayOrder"
          value={DisplayOrder}
          onChange={(e) => setDisplayOrder(e.target.value)}
        />
      </div>

      <div className="mb-3 form-check">
        <input
          type="checkbox"
          className="form-check-input"
          id="isActive"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        <label className="form-check-label" htmlFor="isActive">Active</label>
      </div>

      <button onClick={saveCollection} className="btn btn-primary" disabled={loading}>
        {loading ? 'Saving...' : 'Save'}
      </button>
      <Link to="/collections" className="btn btn-secondary ms-2">Cancel</Link>
    </div>
  );
};

export default CollectionForm;
