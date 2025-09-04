import React, { useState, useEffect } from 'react';
import StoreCreditService from '../services/storeCredit.service';
import RefundService from '../services/refund.service';
import { Modal, Button, Form, Tab, Tabs } from 'react-bootstrap';

const StoreCredit = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState('');
  const [refunds, setRefunds] = useState([]);
  const [includeShipping, setIncludeShipping] = useState({});

  const fetchCustomers = async () => {
    try {
      const response = await StoreCreditService.getAllCustomersWithStoreCredit();
      setCustomers(response.data);
    } catch (err) {
      setError('Failed to fetch customers.');
    }
  };

  const fetchRefunds = async () => {
    try {
      const response = await RefundService.getPendingRefunds();
      setRefunds(response.data);
    } catch (err) {
      setError('Failed to fetch refunds.');
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchRefunds();
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleShowModal = (customer) => {
    setSelectedCustomer(customer);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCustomer(null);
    setAmount(0);
    setReason('');
  };

  const handleSave = async () => {
    try {
      await StoreCreditService.addStoreCredit(selectedCustomer.id, amount, reason);
      setMessage('Store credit updated successfully.');
      fetchCustomers();
      handleCloseModal();
    } catch (err) {
      setError('Failed to update store credit.');
    }
  };

  const handleCreditRefund = async (customerId, total, shipping_cost) => {
    try {
      const finalTotal = includeShipping[customerId] ? total + parseFloat(shipping_cost) : total;
      const customerRefunds = refunds.find(r => r.customer.id === customerId);
      const reason = customerRefunds.refunds.map(r => `${r.product.name} (Qty: ${r.quantity})`).join(', ');
      const fullReason = includeShipping[customerId] ? `${reason}, Shipping` : reason;
      await StoreCreditService.addStoreCredit(customerId, finalTotal, fullReason);
      // Update the state of the refunded items to 'credited'
      for (const refund of customerRefunds.refunds) {
        await RefundService.updateRefundState(refund.id, 'credited');
      }
      setMessage('Refund credited successfully.');
      fetchCustomers();
      fetchRefunds();
    } catch (err) {
      setError('Failed to credit refund.');
    }
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.name && customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container">
      <h2>Store Credit Management</h2>
      <Tabs defaultActiveKey="accounts" id="store-credit-tabs">
        <Tab eventKey="accounts" title="Accounts">
          <div className="form-group mt-3">
            <input
              type="text"
              className="form-control"
              placeholder="Search by name"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Balance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.id}</td>
                  <td>{customer.name}</td>
                  <td>{customer.email}</td>
                  <td>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(customer.credit)}</td>
                  <td>
                    <button className="btn btn-primary btn-sm" onClick={() => handleShowModal(customer)}>Adjust</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Tab>
        <Tab eventKey="pending-refunds" title="Pending Refunds">
          {refunds.map((group) => (
            <div key={group.customer.id} className="mt-3">
              <h4>{group.customer.name}</h4>
              <table className="table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {group.refunds.map((refund) => (
                    <tr key={refund.id}>
                      <td>{refund.order_id}</td>
                      <td>{refund.product.name}</td>
                      <td>{refund.quantity}</td>
                      <td>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(refund.price)}</td>
                      <td>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(refund.quantity * refund.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p><strong>Shipping:</strong> {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(group.shipping_cost)}</p>
              <p><strong>Total:</strong> {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(group.total)}</p>
              {includeShipping[group.customer.id] && (
                <p><strong>Total with Shipping:</strong> {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(group.total + parseFloat(group.shipping_cost))}</p>
              )}
              <div className="form-check">
                <label className="form-check-label" htmlFor={`include-shipping-${group.customer.id}`}>
                  <input
                    type="checkbox"
                    className="form-check-input me-2"
                    id={`include-shipping-${group.customer.id}`}
                    checked={includeShipping[group.customer.id] || false}
                    onChange={(e) => setIncludeShipping({ ...includeShipping, [group.customer.id]: e.target.checked })}
                  />
                  Include Shipping in Refund
                </label>
              </div>
              <button className="btn btn-primary btn-sm mt-2" onClick={() => handleCreditRefund(group.customer.id, group.total, group.shipping_cost)}>Credit Total</button>
            </div>
          ))}
        </Tab>
      </Tabs>
      {message && <div className="alert alert-success mt-3">{message}</div>}
      {error && <div className="alert alert-danger mt-3">{error}</div>}

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Adjust Store Credit for {selectedCustomer?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Amount</Form.Label>
              <Form.Control type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Reason</Form.Label>
              <Form.Control type="text" value={reason} onChange={(e) => setReason(e.target.value)} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default StoreCredit;
