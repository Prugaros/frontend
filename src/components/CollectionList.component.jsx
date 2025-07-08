import React, { useState, useEffect } from 'react';
import CollectionService from '../services/collection.service';
import { Link } from 'react-router-dom';

const CollectionList = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    retrieveCollections();
  }, []);

  const retrieveCollections = () => {
    setLoading(true);
    setError('');

    CollectionService.getAll()
      .then(response => {
        setCollections(response.data);
        setLoading(false);
      })
      .catch(e => {
        setError(e.response?.data?.message || e.message || "Error fetching collections");
        console.error(e);
        setLoading(false);
      });
  };

  const deleteCollection = (id) => {
    if (window.confirm(`Are you sure you want to delete collection ${id}? This cannot be undone.`)) {
      setLoading(true);
      CollectionService.delete(id)
        .then(() => {
          retrieveCollections(); // Refresh the list after deletion
        })
        .catch(e => {
          setError(e.response?.data?.message || e.message || `Error deleting collection ${id}`);
          console.error(e);
          setLoading(false);
        });
    }
  };

  return (
    <div>
      <h2>Collection Management</h2>
      <Link to="/collections/new" className="btn btn-primary mb-3">Add New Collection</Link>

      {loading && <p>Loading collections...</p>}
      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && (
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Display Order</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {collections.map((collection) => (
              <tr key={collection.id}>
                <td>{collection.id}</td>
                <td>{collection.Name}</td>
                <td>{collection.DisplayOrder}</td>
                <td>{collection.isActive ? 'Yes' : 'No'}</td>
                <td>
                  <Link to={`/collections/edit/${collection.id}`} className="btn btn-sm btn-warning me-2">Edit</Link>
                  <button
                    onClick={() => deleteCollection(collection.id)}
                    className="btn btn-sm btn-danger"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!loading && collections.length === 0 && <p>No collections found.</p>}
    </div>
  );
};

export default CollectionList;
