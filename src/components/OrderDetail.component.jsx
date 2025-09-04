import React, { useState, useEffect } from 'react';
import OrderService from '../services/order.service';
import RefundService from '../services/refund.service';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Modal, Button, Form } from 'react-bootstrap';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [refundQuantity, setRefundQuantity] = useState(1);

  useEffect(() => {
    retrieveOrder();
  }, [id]);

  const retrieveOrder = () => {
    setLoading(true);
    setError('');
    setPaymentMessage('');
    OrderService.get(id)
      .then(response => {
        setOrder(response.data);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message || `Error fetching order ${id}`);
        console.error(e);
        setLoading(false);
      });
  };

  const handleMarkAsPaid = () => {
    setIsUpdatingPayment(true);
    setPaymentMessage('');
    OrderService.updatePaymentStatus(id, 'Paid')
      .then(() => {
        setPaymentMessage('Order marked as Paid successfully!');
        setIsUpdatingPayment(false);
        OrderService.triggerPaymentVerification(id)
          .then(() => {
            navigate('/orders');
          })
          .catch(e => {
            setPaymentMessage(e.response?.data?.message || e.message || 'Error triggering payment verification.');
            retrieveOrder();
          });
      })
      .catch(e => {
        setPaymentMessage(e.response?.data?.message || e.message || 'Error marking order as Paid.');
        setIsUpdatingPayment(false);
      });
  };

  const handleShowRefundModal = (item) => {
    setSelectedItem(item);
    setShowRefundModal(true);
  };

  const handleCloseRefundModal = () => {
    setShowRefundModal(false);
    setSelectedItem(null);
    setRefundQuantity(1);
  };

  const handleRefund = async (item) => {
    try {
      const refundItem = item || selectedItem;
      if (!refundItem) {
        setError('No item selected for refund.');
        return;
      }
      await RefundService.createRefund(order.id, refundItem.product_id, refundQuantity, refundItem.price_at_order_time);
      retrieveOrder();
      handleCloseRefundModal();
    } catch (err) {
      console.error('API Error:', err);
      setError('Failed to create refund.');
    }
  };

  if (loading) return <p>Loading order details...</p>;
  if (error) return <p className="text-danger">{error}</p>;
  if (!order) return <p>Order not found.</p>;

  const subtotal = order.orderItems?.reduce((sum, item) => sum + (item.price_at_order_time * item.quantity), 0) || 0;
  const totalRefunded = order.refunds?.reduce((sum, refund) => sum + (refund.price * refund.quantity), 0) || 0;

  const orderedItems = order.orderItems?.map(item => {
    const refundedQuantity = order.refunds?.filter(refund => refund.product_id === item.product_id).reduce((sum, refund) => sum + refund.quantity, 0) || 0;
    return {
      ...item,
      quantity: item.quantity - refundedQuantity
    };
  }).filter(item => item.quantity > 0);

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
           {totalRefunded > 0 && <p><strong>Total Refunded:</strong> ${totalRefunded.toFixed(2)}</p>}
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
             <th>Actions</th>
           </tr>
         </thead>
         <tbody>
           {orderedItems.map((item) => (
             <tr key={item.id}>
               <td>{item.orderProduct?.name || 'N/A'} (ID: {item.product_id})</td>
               <td>{item.quantity}</td>
               <td>${item.price_at_order_time?.toFixed(2)}</td>
               <td>${(item.price_at_order_time * item.quantity).toFixed(2)}</td>
               <td>
                 <button className="btn btn-warning btn-sm" onClick={() => item.quantity > 1 ? handleShowRefundModal(item) : handleRefund(item)}>Refund</button>
               </td>
             </tr>
           ))}
         </tbody>
       </table>

      {order.refunds?.length > 0 && (
        <>
          <h4 className="mt-4">Items Refunded</h4>
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
              {order.refunds.map((refund) => (
                <tr key={refund.id}>
                  <td>{refund.product?.name || 'N/A'} (ID: {refund.product_id})</td>
                  <td>{refund.quantity}</td>
                  <td>${refund.price?.toFixed(2)}</td>
                  <td>${(refund.price * refund.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <Modal show={showRefundModal} onHide={handleCloseRefundModal}>
        <Modal.Header closeButton>
          <Modal.Title>Refund Item</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Quantity to Refund</Form.Label>
              <Form.Control type="number" value={refundQuantity} onChange={(e) => setRefundQuantity(e.target.value)} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseRefundModal}>
            Close
          </Button>
          <Button variant="primary" onClick={() => handleRefund()}>
            Refund
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default OrderDetail;
