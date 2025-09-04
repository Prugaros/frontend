import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import WebviewService from '../services/webview.service';

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

const Payment = () => {
    const query = useQuery();
    const navigate = useNavigate();
    const psid = query.get('psid');
    const [error, setError] = useState('');

    const handlePaymentSent = () => {
        WebviewService.paymentSent(psid)
            .then(() => {
                navigate(`/order-submitted?psid=${psid}`);
            })
            .catch(e => {
                setError(e.response?.data?.message || e.message || "Error processing payment.");
            });
    };

    return (
        <div className="container mt-5 text-center">
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
