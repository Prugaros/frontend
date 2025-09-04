import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import WebviewService from '../services/webview.service';

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

const Payment = () => {
    const query = useQuery();
    const navigate = useNavigate();
    const psid = query.get('psid');
    const [orderSummary, setOrderSummary] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (psid) {
            WebviewService.getOrderSummary(psid)
                .then(response => {
                    setOrderSummary(response.data.orderSummary);
                })
                .catch(e => {
                    setError(e.response?.data?.message || e.message || "Error fetching order summary.");
                });
        }
    }, [psid]);

    const handlePaymentSent = () => {
        WebviewService.paymentSent(psid)
            .then(() => {
                navigate(`/order-submitted?psid=${psid}`);
            })
            .catch(e => {
                setError(e.response?.data?.message || e.message || "Error processing payment.");
            });
    };

    const handleBackToAddress = () => {
        navigate(`/address?psid=${psid}`);
    };

    return (
        <div className="container mt-5 text-center">
            <button className="btn btn-back" onClick={handleBackToAddress}>← Back to Address</button>
            {orderSummary && (
                <div className="order-summary-column mb-4">
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
            )}
            <h2>Payment Information</h2>
            <p className="lead">Please send payment via friends and family to one of these two options:</p>
            <div className="payment-options mt-4">
                <div className="payment-option">
                    <h4>Venmo (preferred)</h4>
                    <p>@naomiseijo</p>
                    <p>(Last 4 digits: 5176 - Add this if needed)</p>
                </div>
                <div className="payment-option mt-4">
                    <h4>PayPal</h4>
                    <p>seijon386@yahoo.com</p>
                </div>
            </div>
            <button className="btn btn-primary mt-4" onClick={handlePaymentSent}>
                Payment Sent
            </button>
            {error && <div className="alert alert-danger mt-3">{error}</div>}
        </div>
    );
};

export default Payment;
