import React, { useState, useEffect } from 'react';
import InventoryService from '../services/inventory.service';

const InStockProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchInStockProducts();
  }, []);

  const fetchInStockProducts = async () => {
    try {
      const response = await InventoryService.findInStock();
      setProducts(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching in stock products:', error);
      setMessage(error.response?.data?.message || error.message || 'Error fetching products');
      setLoading(false);
    }
  };

  if (loading) {
    return <p>Loading in stock products...</p>;
  }

  return (
    <div>
      <h2>In Stock Products</h2>
      {message && <div className="alert alert-danger">{message}</div>}
      {products.length > 0 ? (
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Quantity</th>
            </tr>
          </thead>
<tbody>
            {products
              .map(product => (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td>{product.name}</td>
                  <td>{product.quantityInStock}</td>
                </tr>
              ))}
          </tbody>
        </table>
      ) : (
        <p>No products in stock.</p>
      )}
    </div>
  );
};

export default InStockProducts;
