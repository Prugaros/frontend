import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import WebviewService from '../services/webview.service';
import './AddressForm.component.css';

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

const AddressForm = () => {
    const query = useQuery();
    const navigate = useNavigate();
    const psid = query.get('psid');

    const [address, setAddress] = useState({
        name: '',
        email: '',
        street_address: '',
        city: '',
        state: '',
        zip: ''
    });
    const [orderSummary, setOrderSummary] = useState({
        items: [],
        subtotal: 0,
        shipping: 0,
        appliedCredit: 0,
        total: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (!psid) {
            setError("User ID (PSID) not found in URL.");
            setLoading(false);
            return;
        }
        WebviewService.getAddress(psid)
            .then(response => {
                const { address, orderSummary } = response.data;
                setAddress(address);
                setOrderSummary(orderSummary);
                // If there's no name, assume it's a new customer and start in editing mode.
                if (!address.name) {
                    setIsEditing(true);
                }
                setLoading(false);
            })
            .catch(e => {
                setError(e.response?.data?.message || e.message || "Error fetching address.");
                setLoading(false);
            });
    }, [psid]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setAddress(prevAddress => ({
            ...prevAddress,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSaving(true);
        WebviewService.saveAddress(psid, address)
            .then(() => {
                return WebviewService.submitAddress(psid);
            })
            .then(() => {
                navigate(`/payment?psid=${psid}`);
            })
            .catch(e => {
                setError(e.response?.data?.message || e.message || "Error saving address.");
                setIsSaving(false);
            });
    };

    const handleBackToCart = () => {
        navigate(`/cart?psid=${psid}`);
    };

    if (loading) return <div className="container mt-3"><p>Loading address...</p></div>;
    if (error) return <div className="container mt-3"><div className="alert alert-danger">{error}</div></div>;

    return (
        <div className="container mt-3">
            <button className="btn btn-back" onClick={handleBackToCart}>← Back to Cart</button>
            <form onSubmit={handleSubmit}>
                <div className="form-container">
                    <div className="address-column">
                        <h3>Shipping Information</h3>
                        {isEditing ? (
                            <>
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input type="text" name="name" className="form-control" value={address.name} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input type="email" name="email" className="form-control" value={address.email} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Street Address</label>
                                    <input type="text" name="street_address" className="form-control" value={address.street_address} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>City</label>
                                    <input type="text" name="city" className="form-control" value={address.city} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>State</label>
                                    <input type="text" name="state" className="form-control" value={address.state} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Zip Code</label>
                                    <input type="text" name="zip" className="form-control" value={address.zip} onChange={handleChange} required />
                                </div>
                            </>
                        ) : (
                            <div className="address-display">
                                <p><strong>Full Name:</strong> {address.name}</p>
                                <p><strong>Email:</strong> {address.email}</p>
                                <p><strong>Street Address:</strong> {address.street_address}</p>
                                <p><strong>City:</strong> {address.city}</p>
                                <p><strong>State:</strong> {address.state}</p>
                                <p><strong>Zip Code:</strong> {address.zip}</p>
                                <div className="edit-button-container">
                                    <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(true)}>
                                        Edit
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="order-summary-column">
                        <h3>Order Summary</h3>
                        <div className="order-summary">
                            {orderSummary.items.map((item, index) => (
                                <div key={index} className="order-item">
                                    <span>{item.name} (Qty: {item.quantity})</span>
                                    <span>${item.lineTotal}</span>
                                </div>
                            ))}
                            <hr />
                            <div className="order-total">
                                <span>Subtotal:</span>
                                <span>${orderSummary.subtotal}</span>
                            </div>
                            <div className="order-total">
                                <span>Shipping:</span>
                                <span>${orderSummary.shipping}</span>
                            </div>
                            {orderSummary.appliedCredit > 0 && (
                                <div className="order-total">
                                    <span>Credit Applied:</span>
                                    <span>-${orderSummary.appliedCredit}</span>
                                </div>
                            )}
                            <hr />
                            <div className="order-total">
                                <strong>Total:</strong>
                                <strong>${orderSummary.total}</strong>
                            </div>
                        </div>
                    </div>
                </div>

                {isEditing ? (
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Confirm Address & Submit Order'}
                    </button>
                ) : (
                    <div className="button-group">
                        <button type="submit" className="btn btn-primary" disabled={isSaving}>
                            Confirm Address & Submit Order
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
};

export default AddressForm;
