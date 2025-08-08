import React, { useState, useEffect } from 'react';
import OrderService from '../services/order.service';
import { useParams, Link, useNavigate } from 'react-router-dom'; // Import useNavigate

const OrderDetail = () => {
  const { id } = useParams(); // Get order ID from URL
  const navigate = useNavigate(); // For redirecting after action
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shippingPrep, setShippingPrep] = useState({
      package_type: '',
      package_length: '',
      package_width: '',
      package_height: '',
      total_weight_oz: ''
  });
  const [isSavingPrep, setIsSavingPrep] = useState(false);
  const [prepMessage, setPrepMessage] = useState('');
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false); // State for payment button
  const [paymentMessage, setPaymentMessage] = useState(''); // Message for payment update

  useEffect(() => {
    retrieveOrder();
  }, [id]);

  const retrieveOrder = () => {
    setLoading(true);
    setError('');
    setPaymentMessage(''); // Clear payment message on refresh
    OrderService.get(id)
      .then(response => {
        setOrder(response.data);
        setShippingPrep({
            package_type: response.data.package_type || '',
            package_length: response.data.package_length || '',
            package_width: response.data.package_width || '',
            package_height: response.data.package_height || '',
            total_weight_oz: response.data.total_weight_oz || ''
        });
        setLoading(false);
      })
      .catch(e => {
        setError(e.message || `Error fetching order ${id}`);
        console.error(e);
        setLoading(false);
      });
  };

  const handlePrepChange = (event) => {
      const { name, value } = event.target;
      setShippingPrep(prevState => ({ ...prevState, [name]: value }));
  };

  const handlePrepSubmit = (event) => {
      event.preventDefault();
      setIsSavingPrep(true);
      setPrepMessage('');

      if (!shippingPrep.total_weight_oz) {
          setPrepMessage('Total weight is required.');
          setIsSavingPrep(false);
          return;
      }
      if (shippingPrep.package_type === 'Box Custom' && (!shippingPrep.package_length || !shippingPrep.package_width || !shippingPrep.package_height)) {
           setPrepMessage('Dimensions are required for custom boxes.');
           setIsSavingPrep(false);
           return;
      }

      OrderService.updateShippingPrep(id, shippingPrep)
          .then(() => {
              // Instead of just re-fetching, navigate back to the list
              // Optional: Show success message briefly before navigating? Could use state and setTimeout
              navigate('/orders'); // Redirect immediately after successful save
          })
          .catch(e => {
              setPrepMessage(e.response?.data?.message || e.message || 'Error saving shipping details.');
              setIsSavingPrep(false);
          });
  };

  // Handler for marking order as Paid
  const handleMarkAsPaid = () => {
    setIsUpdatingPayment(true);
    setPaymentMessage('');
    OrderService.updatePaymentStatus(id, 'Paid')
      .then(() => {
        setPaymentMessage('Order marked as Paid successfully!');
        setIsUpdatingPayment(false);
        // Call backend to trigger payment verification
        OrderService.triggerPaymentVerification(id)
          .then(() => {
            navigate('/orders');
          })
          .catch(e => {
            setPaymentMessage(e.response?.data?.message || e.message || 'Error triggering payment verification.');
            retrieveOrder(); // Re-fetch order data to show updated status
          });
      })
      .catch(e => {
        setPaymentMessage(e.response?.data?.message || e.message || 'Error marking order as Paid.');
        setIsUpdatingPayment(false);
      });
  };


  if (loading) return <p>Loading order details...</p>;
  if (error) return <p className="text-danger">{error}</p>;
  if (!order) return <p>Order not found.</p>;

  const subtotal = order.orderItems?.reduce((sum, item) => sum + (item.price_at_order_time * item.quantity), 0) || 0;

  return (
    <div>
      <h2>Order Details #{order.id}</h2>
      <Link to="/orders" className="btn btn-sm btn-secondary mb-3">Back to Orders</Link>

      {paymentMessage && <div className={`alert ${paymentMessage.includes('success') ? 'alert-success' : 'alert-danger'} mt-2`}>{paymentMessage}</div>}

      <div className="row mt-3">
        <div className="col-md-6">
          <h4>Customer Information</h4>
           <p><strong>Name:</strong> {order.customer?.name || 'N/A'}</p>
           <p><strong>Email:</strong> {order.customer?.email || 'N/A'}</p>
           <p><strong>Address:</strong><br />
             {order.customer?.street_address || 'N/A'}<br />
             {order.customer?.city || ''}, {order.customer?.state || ''} {order.customer?.zip || ''}
           </p>
        </div>
        <div className="col-md-6">
          <h4>Order Summary</h4>
           <p><strong>Order Date:</strong> {new Date(order.order_date).toLocaleString()}</p>
           <p><strong>Payment Status:</strong> {order.payment_status}</p>
           <p><strong>Shipping Status:</strong> {order.shipping_status || 'Pending'}</p>
           <p><strong>Subtotal:</strong> ${subtotal.toFixed(2)}</p>
           <p><strong>Shipping Cost:</strong> ${order.shipping_cost?.toFixed(2)}</p>
           <p><strong>Total Amount:</strong> ${order.total_amount?.toFixed(2)}</p>
           {/* Add Mark as Paid Button if status allows */}
           {(order.payment_status === 'Payment Claimed' || order.payment_status === 'Invoice Sent') && (
               <button
                    className="btn btn-success btn-sm mt-2"
                    onClick={handleMarkAsPaid}
                    disabled={isUpdatingPayment}
                >
                    {isUpdatingPayment ? 'Updating...' : 'Mark as Paid'}
                </button>
           )}
        </div>
      </div>

      <h4 className="mt-4">Items Ordered</h4>
       <table className="table table-sm">
         <thead>
           <tr>
             <th>Product</th>
             <th>Quantity</th>
             <th>Price Each</th>
             <th>Total</th>
           </tr>
         </thead>
         <tbody>
           {order.orderItems?.map((item) => (
             <tr key={item.id}>
               <td>{item.orderProduct?.name || 'N/A'} (ID: {item.product_id})</td>
               <td>{item.quantity}</td>
               <td>${item.price_at_order_time?.toFixed(2)}</td>
               <td>${(item.price_at_order_time * item.quantity).toFixed(2)}</td>
             </tr>
           ))}
         </tbody>
       </table>

      <hr />

      <h4>Shipping Preparation</h4>
       <form onSubmit={handlePrepSubmit}>
          <div className="row">
             <div className="col-md-4 mb-3">
                 <label htmlFor="package_type" className="form-label">Package Type</label>
                 <select
                     className="form-select"
                     id="package_type"
                     name="package_type"
                     value={shippingPrep.package_type}
                     onChange={handlePrepChange}
                     required
                 >
                     <option value="">-- Select Type --</option>
                     <option value="Poly Small">Poly Small (9x6)</option>
                     <option value="Poly Medium">Poly Medium (11x8.5)</option>
                     <option value="Poly Large">Poly Large (15x10.5)</option>
                     <option value="Box 6x6x6">Box 6x6x6</option>
                     <option value="Box Custom">Box Custom</option>
                 </select>
             </div>
              <div className="col-md-4 mb-3">
                  <label htmlFor="total_weight_oz" className="form-label">Total Weight (oz)</label>
                  <input
                      type="number"
                      step="0.1"
                      className="form-control"
                      id="total_weight_oz"
                      name="total_weight_oz"
                      value={shippingPrep.total_weight_oz}
                      onChange={handlePrepChange}
                      required
                  />
              </div>
          </div>
           {/* Show dimension fields only for Custom Box */}
           {shippingPrep.package_type === 'Box Custom' && (
               <div className="row">
                   <div className="col-md-4 mb-3">
                       <label htmlFor="package_length" className="form-label">Length</label>
                       <input type="number" step="0.1" className="form-control" id="package_length" name="package_length" value={shippingPrep.package_length} onChange={handlePrepChange} required />
                   </div>
                   <div className="col-md-4 mb-3">
                       <label htmlFor="package_width" className="form-label">Width</label>
                       <input type="number" step="0.1" className="form-control" id="package_width" name="package_width" value={shippingPrep.package_width} onChange={handlePrepChange} required />
                   </div>
                   <div className="col-md-4 mb-3">
                       <label htmlFor="package_height" className="form-label">Height</label>
                       <input type="number" step="0.1" className="form-control" id="package_height" name="package_height" value={shippingPrep.package_height} onChange={handlePrepChange} required />
                   </div>
               </div>
           )}
           {prepMessage && <div className={`alert ${prepMessage.includes('success') ? 'alert-success' : 'alert-danger'} mt-2`}>{prepMessage}</div>}
           <button type="submit" className="btn btn-primary" disabled={isSavingPrep}>
               {isSavingPrep ? 'Saving...' : 'Save Shipping Prep'}
           </button>
       </form>

    </div>
  );
};

export default OrderDetail;
