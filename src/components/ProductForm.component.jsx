import React, { useState, useEffect } from 'react';
import ProductService from '../services/product.service';
import { useParams, useNavigate } from 'react-router-dom';

const ProductForm = () => {
  const { id } = useParams(); // Get ID from URL for editing
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const initialProductState = {
    name: '',
    description: '',
    price: '',
    image_url: '',
    weight_oz: '',
    is_active: true,
  };
  const [product, setProduct] = useState(initialProductState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isEditing) {
      setLoading(true);
      ProductService.get(id)
        .then(response => {
          setProduct({
              ...response.data,
              price: response.data.price || '', // Handle potential null values from DB
              weight_oz: response.data.weight_oz || '',
              image_url: response.data.image_url || '',
              description: response.data.description || '',
          });
          setLoading(false);
        })
        .catch(e => {
          setMessage("Error fetching product: " + (e.response?.data?.message || e.message));
          setLoading(false);
        });
    } else {
        // Reset to initial state if navigating from edit to new
        setProduct(initialProductState);
    }
  }, [id, isEditing]); // Re-run if ID changes (navigating between edit/new)

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setProduct({ ...product, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    // Prepare data, ensuring numeric fields are numbers or null
    const dataToSubmit = {
        ...product,
        price: parseFloat(product.price) || 0, // Default to 0 if invalid
        weight_oz: product.weight_oz ? parseFloat(product.weight_oz) : null,
        // image_url handling might need adjustment if implementing file uploads
    };

    const saveAction = isEditing
      ? ProductService.update(id, dataToSubmit)
      : ProductService.create(dataToSubmit);

    saveAction
      .then(() => {
        navigate('/products'); // Redirect to list after save
      })
      .catch(e => {
        setMessage(e.response?.data?.message || e.message || "Error saving product");
        setLoading(false);
      });
  };

  if (loading && isEditing) return <p>Loading product...</p>;

  return (
    <div>
      <h2>{isEditing ? 'Edit' : 'Create'} Product</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="name" className="form-label">Name</label>
          <input type="text" className="form-control" id="name" name="name" value={product.name} onChange={handleInputChange} required />
        </div>
        <div className="mb-3">
          <label htmlFor="description" className="form-label">Description</label>
          <textarea className="form-control" id="description" name="description" value={product.description} onChange={handleInputChange} />
        </div>
         <div className="row">
            <div className="col-md-6 mb-3">
                <label htmlFor="price" className="form-label">Price ($)</label>
                <input type="number" step="0.01" className="form-control" id="price" name="price" value={product.price} onChange={handleInputChange} required />
            </div>
             <div className="col-md-6 mb-3">
                <label htmlFor="weight_oz" className="form-label">Weight (oz)</label>
                <input type="number" step="0.1" className="form-control" id="weight_oz" name="weight_oz" value={product.weight_oz} onChange={handleInputChange} />
            </div>
         </div>
        <div className="mb-3">
          <label htmlFor="image_url" className="form-label">Image URL</label>
          <input type="text" className="form-control" id="image_url" name="image_url" value={product.image_url} onChange={handleInputChange} placeholder="https://example.com/image.jpg"/>
           {/* TODO: Add file upload alternative later */}
        </div>
         <div className="mb-3 form-check">
            <input type="checkbox" className="form-check-input" id="is_active" name="is_active" checked={product.is_active} onChange={handleInputChange} />
            <label className="form-check-label" htmlFor="is_active">Active (available for new group orders)</label>
        </div>

        {message && <div className="alert alert-danger">{message}</div>}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving...' : 'Save Product'}
        </button>
        <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate('/products')}>
          Cancel
        </button>
      </form>
    </div>
  );
};

export default ProductForm;
