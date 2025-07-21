import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Helper to parse query params
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const CloseNotification = () => {
  const query = useQuery();
  const psid = query.get('psid'); // Not directly used here, but good to keep for context if needed

  useEffect(() => {
    console.log("CloseNotification page loaded. PSID:", psid);
  }, [psid]);

  return (
    <div className="container mt-5 text-center">
      <h2>Order Submitted!</h2>
      <p className="lead">Your order has been successfully submitted.</p>
      <p>Please close this window manually to return to Messenger.</p>
      <p className="text-muted mt-4">Thank you for your order!</p>
    </div>
  );
};

export default CloseNotification;
