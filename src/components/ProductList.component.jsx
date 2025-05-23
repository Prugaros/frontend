import React, { useState, useEffect } from 'react';
import ProductService from '../services/product.service';
import { Link } from 'react-router-dom';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(''); // For delete/update messages

  useEffect(() => {
    retrieveProducts();
  }, []);

  const retrieveProducts = () => {
    setLoading(true);
    setError('');
    setMessage('');
    ProductService.getAll() // Fetch all products for now
      .then(response => {
        setProducts(response.data);
        setLoading(false);
      })
      .catch(e => {
        setError(e.response?.data?.message || e.message || "Error fetching products");
        console.error(e);
        setLoading(false);
      });
  };

  const deleteProduct = (id) => {
      if (window.confirm(`Are you sure you want to delete product ${id}? This cannot be undone.`)) {
          setLoading(true); // Indicate activity
          ProductService.delete(id)
              .then(() => {
                  setMessage(`Product ${id} deleted successfully.`);
                  setLoading(false);
                  // Refresh the list after deletion
                  retrieveProducts();
              })
              .catch(e => {
                  setError(e.response?.data?.message || e.message || `Error deleting product ${id}`);
                  console.error(e);
                  setLoading(false);
              });
      }
  };

  return (
    <div>
      <h2>Product Management</h2>
      <Link to="/products/new" className="btn btn-primary mb-3">Add New Product</Link>

      {message && <div className="alert alert-success">{message}</div>}
      {loading && <p>Loading products...</p>}
      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && (
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Price</th>
              <th>Weight (oz)</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>{product.name}</td>
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
       {!loading && products.length === 0 && <p>No products found.</p>}
    </div>
  );
};

export default ProductList;
