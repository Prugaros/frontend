import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import customerService from '../services/customer.service';

// Helper to parse query params
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const OrderSubmitted = () => {
  const query = useQuery();
  const psid = query.get('psid');
  const [wantsDestash, setWantsDestash] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (psid) {
      customerService.getCustomerStatus(psid).then(response => {
        setWantsDestash(response.data.wants_destash_notification);
      }).catch(error => {
        console.error("Error fetching customer status:", error);
      });
    }
  }, [psid]);

  const handleJoinDestash = () => {
    customerService.updateDestashNotification(psid).then(() => {
      setWantsDestash(true);
      setMessage("You've been added to the destash notification list!");
    }).catch(error => {
      console.error("Error updating destash notification:", error);
      setMessage("There was an error signing you up. Please try again.");
    });
  };

  return (
    <div className="container mt-5 text-center">
      <h2>Order Submitted!</h2>
      <p>We will notify you in chat once your payment has been manually verified.</p>
      <p className="text-muted mt-4">Thank you for your order!</p>

      <div className="mt-5 p-4 border rounded">
        <h4>P.S. I'm having a huge destash!</h4>
        <p>
          If you wish to be notified about my destash, please click the button below! I will send you an email once the destash is ready to launch.
        </p>
      </div>

      <div className="mt-4">
        {wantsDestash === false && (
          <button className="btn btn-primary" onClick={handleJoinDestash}>
            Join Destash Notification List
          </button>
        )}
        {wantsDestash === true && !message && (
          <p>You are already on the destash notification list.</p>
        )}
        {message && <p className="mt-3">{message}</p>}
      </div>
    </div>
  );
};

export default OrderSubmitted;
