import React, { useState, useEffect } from 'react';
import WebviewService from '../services/webview.service';
import './MessengerOrder.component.css'; // Reuse existing styles for consistency

const DestashSignup = () => {
    const [email, setEmail] = useState('');
    const [isSignedUp, setIsSignedUp] = useState(false);
    const [psid, setPsid] = useState('');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const psidParam = urlParams.get('psid');
        if (psidParam) {
            setPsid(psidParam);
            WebviewService.getDestashProfile(psidParam)
                .then(response => {
                    setEmail(response.data.email);
                    setIsSignedUp(response.data.wants_destash_notification);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Error fetching destash profile:", err);
                    setError("Failed to load profile.");
                    setLoading(false);
                });
        } else {
            setError("Missing PSID. Please open this from Messenger.");
            setLoading(false);
        }
    }, []);

    const handleSignup = (e) => {
        e.preventDefault();
        if (!email) {
            setError("Email is required.");
            return;
        }
        setLoading(true);
        WebviewService.signupDestash(psid, email)
            .then(response => {
                setIsSignedUp(true);
                setMessage(response.data.message);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error signing up:", err);
                setError("Failed to sign up. Please try again.");
                setLoading(false);
            });
    };

    if (loading) return <div className="p-4 text-center" style={{ color: '#e0e0e0' }}>Loading...</div>;

    return (
        <div className="destash-container">
            <div className="messenger-order-container p-4">
                <h2 className="mb-4" style={{ color: '#8ab4f8' }}>Destash Notifications</h2>

                {message && <div className="alert alert-success">{message}</div>}
                {error && <div className="alert alert-danger">{error}</div>}

                {isSignedUp ? (
                    <div className="text-center py-4">
                        <div className="h4 text-success mb-3">✓ Signed up for Destash</div>
                        <p style={{ color: '#b0b0b0' }}>You'll be notified when new destash items are available!</p>
                    </div>
                ) : (
                    <form onSubmit={handleSignup}>
                        <p className="mb-4" style={{ color: '#b0b0b0' }}>Enter your email below to get notified about our next destash event.</p>
                        <div className="mb-3">
                            <label className="form-label" style={{ color: '#e0e0e0' }}>Email Address</label>
                            <input
                                type="email"
                                className="form-control"
                                placeholder="your@email.com"
                                style={{
                                    backgroundColor: '#4a4a4a',
                                    color: '#e0e0e0',
                                    border: '1px solid #555'
                                }}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary w-100 mt-3"
                            style={{
                                backgroundColor: '#8ab4f8',
                                borderColor: '#8ab4f8',
                                color: '#202124',
                                fontWeight: 'bold',
                                padding: '12px'
                            }}
                        >
                            Sign Up
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default DestashSignup;
