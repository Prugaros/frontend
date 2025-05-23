import React, { useState, useEffect } from 'react';
import GroupOrderService from '../services/groupOrder.service';
import ProductService from '../services/product.service'; // Use ProductService
import { useParams, useNavigate } from 'react-router-dom';

const GroupOrderForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const initialGroupOrderState = { name: '', start_date: '', end_date: '', productIds: [] };
  const [groupOrder, setGroupOrder] = useState(initialGroupOrderState);
  const [allProducts, setAllProducts] = useState([]); // To populate product selection
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [productsLoading, setProductsLoading] = useState(true); // Separate loading for products

  useEffect(() => {
    // Fetch all available ACTIVE products for selection
    setProductsLoading(true);
    ProductService.getAll({ activeOnly: true }) // Fetch only active products
      .then(response => {
          setAllProducts(response.data);
          setProductsLoading(false);
      })
      .catch(e => {
          setMessage("Error fetching products: " + (e.response?.data?.message || e.message));
          setProductsLoading(false);
      });

    // If editing, fetch the specific group order details
    if (isEditing) {
      setLoading(true);
      GroupOrderService.get(id)
        .then(response => {
          const data = response.data;
          const formattedStartDate = data.start_date ? new Date(data.start_date).toISOString().split('T')[0] : '';
          const formattedEndDate = data.end_date ? new Date(data.end_date).toISOString().split('T')[0] : '';
          setGroupOrder({
              ...initialGroupOrderState, // Start fresh
              name: data.name || '',
              start_date: formattedStartDate,
              end_date: formattedEndDate,
              productIds: data.products?.map(p => p.id) || [] // Extract product IDs
          });
          setLoading(false);
        })
        .catch(e => {
          setMessage("Error fetching group order: " + (e.response?.data?.message || e.message));
          setLoading(false);
        });
    } else {
        // Reset to initial state if navigating from edit to new
        setGroupOrder(initialGroupOrderState);
    }
  }, [id, isEditing]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setGroupOrder({ ...groupOrder, [name]: value });
  };

  const handleProductSelectionChange = (event) => {
      const { options } = event.target;
      const selectedProductIds = [];
      for (let i = 0, l = options.length; i < l; i++) {
          if (options[i].selected) {
              selectedProductIds.push(parseInt(options[i].value));
          }
      }
      setGroupOrder({ ...groupOrder, productIds: selectedProductIds });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    const dataToSubmit = {
        name: groupOrder.name,
        start_date: groupOrder.start_date || null,
        end_date: groupOrder.end_date || null,
        productIds: groupOrder.productIds
        // Status is handled by backend (defaults to Draft on create, updated via Start/End actions)
    };

    const saveAction = isEditing
      ? GroupOrderService.update(id, dataToSubmit)
      : GroupOrderService.create(dataToSubmit);

    saveAction
      .then(() => {
        navigate('/group-orders'); // Redirect to list after save
      })
      .catch(e => {
        setMessage(e.response?.data?.message || e.message || "Error saving group order");
        setLoading(false);
      });
  };

  if (loading && isEditing) return <p>Loading group order...</p>;

  return (
    <div>
      <h2>{isEditing ? 'Edit' : 'Create'} Group Order</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="name" className="form-label">Name</label>
          <input
            type="text"
            className="form-control"
            id="name"
            name="name"
            value={groupOrder.name}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="start_date" className="form-label">Start Date (Optional)</label>
          <input
            type="date"
            className="form-control"
            id="start_date"
            name="start_date"
            value={groupOrder.start_date}
            onChange={handleInputChange}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="end_date" className="form-label">End Date (Optional)</label>
          <input
            type="date"
            className="form-control"
            id="end_date"
            name="end_date"
            value={groupOrder.end_date}
            onChange={handleInputChange}
          />
        </div>

        <div className="mb-3">
            <label htmlFor="products" className="form-label">Select Products for this Group Order</label>
            {productsLoading ? <p>Loading products...</p> :
                <select
                    multiple
                    className="form-control"
                    id="products"
                    name="products"
                    value={groupOrder.productIds.map(String)} // Value needs array of strings
                    onChange={handleProductSelectionChange}
                    style={{ height: '250px' }}
                    disabled={loading}
                >
                    {allProducts.map(product => (
                        <option key={product.id} value={product.id}>
                            {product.name} (${product.price})
                        </option>
                    ))}
                </select>
            }
            <small className="form-text text-muted">Hold Ctrl (or Cmd on Mac) to select multiple products.</small>
        </div>


        {message && <div className="alert alert-danger">{message}</div>}

        <button type="submit" className="btn btn-primary" disabled={loading || productsLoading}>
          {loading ? 'Saving...' : 'Save Group Order'}
        </button>
        <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate('/group-orders')}>
          Cancel
        </button>
      </form>
    </div>
  );
};

export default GroupOrderForm;
