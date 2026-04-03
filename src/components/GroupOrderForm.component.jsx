import React, { useState, useEffect } from 'react';
import GroupOrderService from '../services/groupOrder.service';
import ProductService from '../services/product.service';
import { useParams, useNavigate } from 'react-router-dom';

const GroupOrderForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const initialGroupOrderState = { name: '', start_date: '', end_date: '', custom_message: '', email_custom_message: '', facebook_image_url: '', email_image_url: '', postToFacebook: true };
  const [groupOrder, setGroupOrder] = useState(initialGroupOrderState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
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
            custom_message: data.custom_message || '',
            email_custom_message: data.email_custom_message || '',
            facebook_image_url: data.facebook_image_url || '',
            email_image_url: data.email_image_url || '',
            postToFacebook: data.postToFacebook !== undefined ? data.postToFacebook : true
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
    const { name, value, type, checked } = event.target;
    setGroupOrder({ ...groupOrder, [name]: type === 'checkbox' ? checked : value });
  };

  const handleImageUpload = (event, field) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('images', file);

    setLoading(true);
    ProductService.uploadImages(formData)
      .then(response => {
        if (response.data && response.data.imageUrls && response.data.imageUrls.length > 0) {
          setGroupOrder({ ...groupOrder, [field]: response.data.imageUrls[0] });
        }
        setLoading(false);
      })
      .catch(e => {
        setMessage("Error uploading image: " + (e.response?.data?.message || e.message));
        setLoading(false);
      });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    const dataToSubmit = {
      name: groupOrder.name,
      start_date: groupOrder.start_date || null,
      end_date: groupOrder.end_date || null,
      custom_message: groupOrder.custom_message,
      email_custom_message: groupOrder.email_custom_message,
      facebook_image_url: groupOrder.facebook_image_url,
      email_image_url: groupOrder.email_image_url,
      postToFacebook: groupOrder.postToFacebook
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

        <hr className="my-4" />
        <div className="card mb-4 bg-dark border-secondary">
          <div className="card-header border-secondary">
            <h4 className="mb-0">Facebook Announcement</h4>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label htmlFor="custom_message" className="form-label">Facebook Post Message</label>
              <textarea
                className="form-control"
                id="custom_message"
                name="custom_message"
                value={groupOrder.custom_message}
                onChange={handleInputChange}
                rows="5"
                placeholder="Message to include in the Facebook post..."
              />
            </div>
            
            <div className="mb-3">
              <label htmlFor="facebook_image" className="form-label">Facebook Banner Image (Optional)</label>
              <input
                type="file"
                className="form-control mb-2"
                id="facebook_image"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'facebook_image_url')}
              />
              {groupOrder.facebook_image_url && (
                <div className="mt-2">
                  <img src={groupOrder.facebook_image_url.startsWith('http') ? groupOrder.facebook_image_url : `${import.meta.env.VITE_BACKEND_URL}${groupOrder.facebook_image_url}`} alt="Facebook Banner" className="img-thumbnail bg-dark" style={{ maxHeight: '150px' }} />
                </div>
              )}
              <small className="text-muted d-block mt-1">If not uploaded, the post will fall back to using default featured product images.</small>
            </div>

            <div className="form-check mt-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="postToFacebook"
                name="postToFacebook"
                checked={groupOrder.postToFacebook}
                onChange={handleInputChange}
              />
              <label className="form-check-label" htmlFor="postToFacebook">
                Auto-post to Facebook when this Group Order starts
              </label>
            </div>
          </div>
        </div>

        <div className="card mb-4 bg-dark border-secondary">
          <div className="card-header border-secondary">
            <h4 className="mb-0">Email Announcement</h4>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label htmlFor="email_custom_message" className="form-label">Email Message</label>
              <textarea
                className="form-control"
                id="email_custom_message"
                name="email_custom_message"
                value={groupOrder.email_custom_message}
                onChange={handleInputChange}
                rows="5"
                placeholder="Message to include in the broadcast email..."
              />
            </div>
            
            <div className="mb-3">
              <label htmlFor="email_image" className="form-label">Email Banner Image (Optional)</label>
              <input
                type="file"
                className="form-control mb-2"
                id="email_image"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'email_image_url')}
              />
              {groupOrder.email_image_url && (
                <div className="mt-2">
                  <img src={groupOrder.email_image_url.startsWith('http') ? groupOrder.email_image_url : `${import.meta.env.VITE_BACKEND_URL}${groupOrder.email_image_url}`} alt="Email Banner" className="img-thumbnail bg-dark" style={{ maxHeight: '150px' }} />
                </div>
              )}
            </div>
          </div>
        </div>

        {message && <div className="alert alert-danger">{message}</div>}

        <button type="submit" className="btn btn-primary" disabled={loading}>
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
