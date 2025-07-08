import React, { useState, useEffect } from 'react';
import ProductService from '../services/product.service';
import { Link } from 'react-router-dom';

const ProductListTable = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    retrieveProducts();
  }, [searchTerm]);

  const retrieveProducts = () => {
    setLoading(true);
    setError('');
    setMessage('');

    let filters = {};
    if (searchTerm) {
      filters.searchTerm = searchTerm;
    }

    ProductService.getAll(filters)
      .then(response => {
        setProducts(response.data);
        setFilteredProducts(response.data);
        setLoading(false);
      })
      .catch(e => {
        setError(e.response?.data?.message || e.message || "Error fetching products");
        console.error(e);
        setLoading(false);
      });
  };

 useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.collection && product.collection.Name && product.collection.Name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const deleteProduct = (id) => {
    if (window.confirm(`Are you sure you want to delete product ${id}? This cannot be undone.`)) {
      setLoading(true);
      ProductService.delete(id)
        .then(() => {
          setMessage(`Product ${id} deleted successfully.`);
          setLoading(false);
          retrieveProducts(); // Refresh the list after deletion
        })
        .catch(e => {
          setError(e.response?.data?.message || e.message || `Error deleting product ${id}`);
          console.error(e);
          setLoading(false);
        });
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div>
      <h2>Product Management</h2>
      <Link to="/products/new" className="btn btn-primary mb-3">Add New Product</Link>

      {/* Search Bar */}
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Search by name or collection"
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {loading && <p>Loading products...</p>}
      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && (
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Collection</th>
              <th>Price</th>
              <th>Weight (oz)</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>{product.name}</td>
                <td>{product.collection ? product.collection.Name : '-'}</td>
                <td>${product.price}</td>
                <td>{product.weight_oz || '-'}</td>
                <td>{product.is_active ? 'Yes' : 'No'}</td>
                <td>
                  <Link to={`/products/edit/${product.id}`} className="btn btn-sm btn-warning me-2">Edit</Link>
                  <button
                    onClick={() => deleteProduct(product.id)}
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
      {!loading && filteredProducts.length === 0 && <p>No products found.</p>}
    </div>
  );
};

export default ProductListTable;
