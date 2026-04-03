import React, { useState, useEffect } from 'react';
import OrderService from '../services/order.service';
import RefundService from '../services/refund.service';
import ProductService from '../services/product.service';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Modal, Button, Form } from 'react-bootstrap';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');
  
  // Refund states
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [refundQuantity, setRefundQuantity] = useState(1);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    shipping_cost: 0,
    applied_credit: 0,
    total_amount: 0,
    payment_status: '',
    shipping_status: '',
    orderItems: [] // Array of { id, product_id, name, quantity, price_at_order_time }
  });

  // Add Product states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ product_id: '', quantity: 1, price_at_order_time: 0 });

  useEffect(() => {
    retrieveOrder();
    fetchProducts();
  }, [id]);

  const fetchProducts = () => {
    ProductService.getAll().then(res => setProducts(res.data)).catch(console.error);
  };

  const retrieveOrder = () => {
    setLoading(true);
    setError('');
    // Don't clear payment message if it was set by an update
    OrderService.get(id)
      .then(response => {
        const fetchedOrder = response.data;
        setOrder(fetchedOrder);
        setLoading(false);
        
        const initialItems = fetchedOrder.orderItems?.map(item => ({
          id: item.id,
          product_id: item.product_id,
          name: item.orderProduct?.name || 'Unknown Product',
          quantity: item.quantity,
          price_at_order_time: item.price_at_order_time
        })) || [];

        setEditFormData({
          shipping_cost: fetchedOrder.shipping_cost || 0,
          applied_credit: fetchedOrder.applied_credit || 0,
          total_amount: fetchedOrder.total_amount || 0,
          payment_status: fetchedOrder.payment_status || 'Invoice Sent',
          shipping_status: fetchedOrder.shipping_status || 'Pending',
          orderItems: initialItems
        });
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
    OrderService.markAsPaid(order.customer.id, order.group_order_id)
      .then(() => {
        setPaymentMessage('Order marked as Paid and summary sent successfully!');
        setIsUpdatingPayment(false);
        navigate('/orders');
      })
      .catch(e => {
        setPaymentMessage(e.response?.data?.message || e.message || 'Error marking order as Paid.');
        setIsUpdatingPayment(false);
      });
  };

  const handleSaveChanges = async () => {
    try {
      setError('');
      setPaymentMessage('');
      await OrderService.update(id, editFormData);
      setIsEditing(false);
      setPaymentMessage('Order updated successfully!');
      retrieveOrder();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order.');
      console.error(err);
    }
  };

  const calculateTotal = () => {
    const subtotal = editFormData.orderItems.reduce((sum, item) => sum + (item.quantity * item.price_at_order_time), 0);
    const total = subtotal + parseFloat(editFormData.shipping_cost || 0) - parseFloat(editFormData.applied_credit || 0);
    setEditFormData({ ...editFormData, total_amount: total.toFixed(2) });
  };

  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...editFormData.orderItems];
    newItems[index][field] = value;
    setEditFormData({ ...editFormData, orderItems: newItems });
  };

  const handleRemoveItem = (index) => {
    const newItems = [...editFormData.orderItems];
    newItems.splice(index, 1);
    setEditFormData({ ...editFormData, orderItems: newItems });
  };

  const handleAddProduct = () => {
    if (!newProduct.product_id) return;
    const prod = products.find(p => p.id.toString() === newProduct.product_id.toString());
    if (prod) {
      setEditFormData({
        ...editFormData,
        orderItems: [...editFormData.orderItems, {
          id: null,
          product_id: prod.id,
          name: prod.name,
          quantity: parseInt(newProduct.quantity, 10),
          price_at_order_time: parseFloat(newProduct.price_at_order_time || prod.price)
        }]
      });
    }
    setShowAddModal(false);
    setNewProduct({ product_id: '', quantity: 1, price_at_order_time: 0 });
  };

  const openAddModal = () => {
    setNewProduct({ product_id: '', quantity: 1, price_at_order_time: 0 });
    setShowAddModal(true);
  };

  // --- Refunds Logic ---
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

  const getRefundedQuantity = (productId) => {
    if (!order || !order.refunds) return 0;
    return order.refunds.filter(r => r.product_id === productId).reduce((sum, r) => sum + r.quantity, 0);
  };

  if (loading) return <p>Loading order details...</p>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!order) return <p>Order not found.</p>;

  const subtotal = order.orderItems?.reduce((sum, item) => sum + (item.price_at_order_time * item.quantity), 0) || 0;
  const totalRefunded = order.refunds?.reduce((sum, refund) => sum + (refund.price * refund.quantity), 0) || 0;

  const orderedItems = order.orderItems?.map(item => {
    const refundedQty = getRefundedQuantity(item.product_id);
    return { ...item, quantity: item.quantity - refundedQty };
  }).filter(item => item.quantity > 0);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Order Details #{order.id}</h2>
        <div>
          {isEditing ? (
            <>
              <button className="btn btn-success me-2" onClick={handleSaveChanges}>Save Changes</button>
              <button className="btn btn-secondary" onClick={() => { setIsEditing(false); retrieveOrder(); }}>Cancel</button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={() => setIsEditing(true)}>Edit Order</button>
          )}
        </div>
      </div>
      <Link to="/orders" className="btn btn-sm btn-secondary mb-3">Back to Orders</Link>

      {paymentMessage && <div className={`alert ${paymentMessage.includes('success') ? 'alert-success' : 'alert-info'} mt-2`}>{paymentMessage}</div>}

      <div className="row mt-3">
        <div className="col-md-6">
          <h4>Customer Information</h4>
           <p><strong>Name:</strong> {order.customer?.name || 'N/A'}</p>
           <p><strong>Email:</strong> {order.customer?.email || 'N/A'}</p>
           <p><strong>Address:</strong><br />
             {
               order.customer?.is_international
                 ? <span dangerouslySetInnerHTML={{ __html: order.customer.international_address_block.replace(/\n/g, '<br />') }} />
                 : <>
                     {order.customer?.street_address || 'N/A'}<br />
                     {order.customer?.city || ''}, {order.customer?.state || ''} {order.customer?.zip || ''}
                   </>
             }
           </p>
        </div>
        <div className="col-md-6">
          <h4>Order Summary</h4>
           <p><strong>Order Date:</strong> {new Date(order.order_date).toLocaleString()}</p>
           
           {!isEditing ? (
             <>
               <p><strong>Payment Status:</strong> {order.payment_status}</p>
               <p><strong>Shipping Status:</strong> {order.shipping_status || 'Pending'}</p>
               <p><strong>Subtotal:</strong> ${subtotal.toFixed(2)}</p>
               <p><strong>Shipping Cost:</strong> ${order.shipping_cost?.toFixed(2) || '0.00'}</p>
               <p><strong>Applied Credit:</strong> ${order.applied_credit?.toFixed(2) || '0.00'}</p>
               <p><strong>Total Amount:</strong> ${order.total_amount?.toFixed(2)}</p>
             </>
           ) : (
             <div className="card p-3 mb-3">
               <div className="mb-2">
                 <label>Payment Status</label>
                 <select className="form-select form-select-sm" name="payment_status" value={editFormData.payment_status} onChange={handleEditChange}>
                   <option value="Invoice Sent">Invoice Sent</option>
                   <option value="Payment Claimed">Payment Claimed</option>
                   <option value="Paid">Paid</option>
                   <option value="Error">Error</option>
                   <option value="Cancelled">Cancelled</option>
                 </select>
               </div>
               <div className="mb-2">
                 <label>Shipping Status</label>
                 <select className="form-select form-select-sm" name="shipping_status" value={editFormData.shipping_status} onChange={handleEditChange}>
                   <option value="Pending">Pending</option>
                   <option value="Processing">Processing</option>
                   <option value="Packed">Packed</option>
                   <option value="Shipped">Shipped</option>
                   <option value="Delivered">Delivered</option>
                   <option value="Issue">Issue</option>
                 </select>
               </div>
               <div className="mb-2">
                  <label>Shipping Cost ($)</label>
                  <input type="number" step="0.01" className="form-control form-control-sm" name="shipping_cost" value={editFormData.shipping_cost} onChange={handleEditChange} />
               </div>
               <div className="mb-2">
                  <label>Applied Credit ($)</label>
                  <input type="number" step="0.01" className="form-control form-control-sm" name="applied_credit" value={editFormData.applied_credit} onChange={handleEditChange} />
               </div>
               <div className="mb-2">
                  <label>Total Amount ($)</label>
                  <div className="input-group input-group-sm">
                    <input type="number" step="0.01" className="form-control" name="total_amount" value={editFormData.total_amount} onChange={handleEditChange} />
                    <button className="btn btn-outline-secondary" type="button" onClick={calculateTotal}>Auto Calc</button>
                  </div>
               </div>
             </div>
           )}

           {!isEditing && totalRefunded > 0 && <p className="text-danger"><strong>Total Refunded:</strong> ${totalRefunded.toFixed(2)}</p>}
           
           {!isEditing && (order.payment_status === 'Payment Claimed' || order.payment_status === 'Invoice Sent') && (
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

      <div className="d-flex justify-content-between align-items-center mt-4">
        <h4>Items Ordered</h4>
        {isEditing && <button className="btn btn-sm btn-info" onClick={openAddModal}>+ Add Product</button>}
      </div>

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
          {!isEditing ? (
            orderedItems.map(item => (
              <tr key={item.id}>
                <td>{item.orderProduct?.name || 'Unknown Product'} (ID: {item.product_id})</td>
                <td>{item.quantity}</td>
                <td>${Number(item.price_at_order_time).toFixed(2)}</td>
                <td>${(item.price_at_order_time * item.quantity).toFixed(2)}</td>
                <td>
                  <button className="btn btn-warning btn-sm" onClick={() => item.quantity > 1 ? handleShowRefundModal(item) : handleRefund(item)}>Refund</button>
                </td>
              </tr>
            ))
          ) : (
            editFormData.orderItems.map((item, idx) => {
              const refundedQty = getRefundedQuantity(item.product_id);
              const hasRefund = refundedQty > 0;
              return (
                <tr key={idx}>
                  <td>{item.name} (ID: {item.product_id}) {hasRefund && <span className="badge bg-warning text-dark ms-2">Refunded: {refundedQty}</span>}</td>
                  <td>
                    <input type="number" min={refundedQty || 1} className="form-control form-control-sm" style={{width: '80px'}} 
                      value={item.quantity} onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)} />
                  </td>
                  <td>
                    <input type="number" step="0.01" className="form-control form-control-sm" style={{width: '90px'}} 
                      value={item.price_at_order_time} onChange={(e) => handleItemChange(idx, 'price_at_order_time', e.target.value)} />
                  </td>
                  <td>${(item.quantity * item.price_at_order_time).toFixed(2)}</td>
                  <td>
                    {!hasRefund && <button className="btn btn-danger btn-sm" onClick={() => handleRemoveItem(idx)}>Remove</button>}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {!isEditing && order.refunds?.length > 0 && (
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
                  <td>{refund.product?.name || 'Unknown Product'} (ID: {refund.product_id})</td>
                  <td>{refund.quantity}</td>
                  <td>${Number(refund.price).toFixed(2)}</td>
                  <td>${(refund.price * refund.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Add Product Modal (For Edit Mode) */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Product to Order</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Select Product</Form.Label>
              <select 
                className="form-select" 
                value={newProduct.product_id} 
                onChange={(e) => {
                  const pid = e.target.value;
                  const prod = products.find(p => p.id.toString() === pid);
                  if (prod) {
                    setNewProduct({ ...newProduct, product_id: pid, price_at_order_time: prod.price });
                  } else {
                    setNewProduct({ ...newProduct, product_id: pid });
                  }
                }}
              >
                <option value="">-- Search & Select Product --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (${p.price})</option>
                ))}
              </select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Quantity</Form.Label>
              <Form.Control type="number" min="1" value={newProduct.quantity} onChange={(e) => setNewProduct({...newProduct, quantity: e.target.value})} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Price Each</Form.Label>
              <Form.Control type="number" step="0.01" value={newProduct.price_at_order_time} onChange={(e) => setNewProduct({...newProduct, price_at_order_time: e.target.value})} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAddProduct} disabled={!newProduct.product_id}>Add to Order</Button>
        </Modal.Footer>
      </Modal>

      {/* Existing Refund Modal */}
      <Modal show={showRefundModal} onHide={handleCloseRefundModal}>
        <Modal.Header closeButton>
          <Modal.Title>Refund Item</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Quantity to Refund</Form.Label>
              <Form.Control type="number" min="1" max={selectedItem?.quantity || 1} value={refundQuantity} onChange={(e) => setRefundQuantity(e.target.value)} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseRefundModal}>Close</Button>
          <Button variant="primary" onClick={() => handleRefund()}>Process Refund</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default OrderDetail;
