import React, { useState, useEffect } from 'react';
import OrderService from '../services/order.service';
import GroupOrderService from '../services/groupOrder.service'; // To fetch group orders for filter
import { Link } from 'react-router-dom';

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [groupOrders, setGroupOrders] = useState([]); // For filter dropdown
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false); // State for export button loading

  // Filter State
  const [filterGroupOrderId, setFilterGroupOrderId] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('');
  const [filterCustomerName, setFilterCustomerName] = useState('');

  // Fetch group orders for the filter dropdown on initial load
  useEffect(() => {
    GroupOrderService.getAll()
      .then(response => {
        setGroupOrders(response.data);
      })
      .catch(e => {
        console.error("Error fetching group orders for filter:", e);
        setError("Could not load group orders for filtering.");
      });
  }, []);

  // Fetch orders whenever filters change
  useEffect(() => {
    retrieveOrders();
  }, [filterGroupOrderId, filterPaymentStatus, filterCustomerName]); // Re-fetch when filters change

  const retrieveOrders = () => {
    setLoading(true);
    setError(''); // Clear previous errors

    const filters = {};
    if (filterGroupOrderId) filters.groupOrderId = filterGroupOrderId;
    if (filterPaymentStatus) filters.paymentStatus = filterPaymentStatus;
    if (filterCustomerName) filters.customerName = filterCustomerName;

    OrderService.getAll(filters)
      .then(response => {
        setOrders(response.data);
        setLoading(false);
      })
      .catch(e => {
        setError(e.response?.data?.message || e.message || "Error fetching orders");
        console.error(e);
        setLoading(false);
      });
  };

  const handleFilterChange = (event) => {
      const { name, value } = event.target;
      if (name === 'groupOrderId') setFilterGroupOrderId(value);
      if (name === 'paymentStatus') setFilterPaymentStatus(value);
      if (name === 'customerName') setFilterCustomerName(value);
      // Note: useEffect will trigger retrieveOrders automatically
  };

  // Updated handleExport to accept generic 'polymailer' or 'box'
  const handleExport = (packageCategory) => {
      if (!filterGroupOrderId) {
          alert("Please select a Group Order to export.");
          return;
      }
      setExporting(true);
      setError('');

      // Pass the generic category to the service/API
      const filters = { groupOrderId: filterGroupOrderId, packageCategory: packageCategory };

      OrderService.exportCsv(filters) // Assuming service/API handles 'packageCategory'
          .then(response => {
              const contentDisposition = response.headers['content-disposition'];
              let filename = `orders_export_${packageCategory}_${filterGroupOrderId}.csv`;
              if (contentDisposition) {
                  const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
                  if (filenameMatch && filenameMatch.length === 2)
                      filename = filenameMatch[1];
              }
              OrderService.downloadCsvFile(response.data, filename);
              setExporting(false);
          })
          .catch(e => {
              if (e.response?.status === 404) {
                 setError(`No ${packageCategory} orders found for Group Order ${filterGroupOrderId} with relevant payment status.`);
              } else {
                 setError(e.response?.data?.message || e.message || "Error exporting CSV");
              }
              console.error(e);
              setExporting(false);
          });
  };


  return (
    <div>
      <h2>Orders</h2>

      {/* Filter UI */}
      <div className="row g-3 align-items-center mb-3 p-3 border rounded bg-light">
         <div className="col-md-4">
          <label htmlFor="groupOrderId" className="form-label">Filter by Group Order:</label>
          <select
            className="form-select form-select-sm"
            id="groupOrderId"
            name="groupOrderId"
            value={filterGroupOrderId}
            onChange={handleFilterChange}
          >
            <option value="">All Group Orders</option>
            {groupOrders.map(go => (
              <option key={go.id} value={go.id}>{go.name} (ID: {go.id})</option>
            ))}
          </select>
        </div>
         <div className="col-md-3">
          <label htmlFor="paymentStatus" className="form-label">Payment Status:</label>
           <select
            className="form-select form-select-sm"
            id="paymentStatus"
            name="paymentStatus"
            value={filterPaymentStatus}
            onChange={handleFilterChange}
          >
            <option value="">All</option>
            <option value="Invoice Sent">Invoice Sent</option>
            <option value="Payment Claimed">Payment Claimed</option>
            <option value="Paid">Paid</option>
            <option value="Error">Error</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
         <div className="col-md-4">
          <label htmlFor="customerName" className="form-label">Customer Name:</label>
           <input
            type="text"
            className="form-control form-control-sm"
            id="customerName"
            name="customerName"
            placeholder="Filter by name..."
            value={filterCustomerName}
            onChange={handleFilterChange}
           />
        </div>
      </div>

       {/* Export Buttons - Consolidated */}
       <div className="mb-3">
           <button
                className="btn btn-success me-2"
                onClick={() => handleExport('polymailer')} // Pass generic type
                disabled={!filterGroupOrderId || loading || exporting}
            >
                {exporting ? 'Exporting...' : 'Export Polymailers CSV'}
            </button>
            <button
                className="btn btn-success me-2"
                onClick={() => handleExport('box')} // Pass generic type
                disabled={!filterGroupOrderId || loading || exporting}
            >
                 {exporting ? 'Exporting...' : 'Export Boxes CSV'}
            </button>
            <small className="text-muted"> (Select a Group Order first)</small>
       </div>


      {loading && <p>Loading orders...</p>}
      {error && <div className="alert alert-danger">{error}</div>}
      {!loading && !error && (
        <div className="table-responsive">
            <table className="table table-striped table-hover table-sm">
            <thead>
                <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Email</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Shipping</th>
                <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {orders.map((order) => (
                <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{new Date(order.order_date).toLocaleDateString()}</td>
                    <td>{order.customer?.name || 'N/A'}</td>
                    <td>{order.customer?.email || 'N/A'}</td>
                    <td>${order.total_amount?.toFixed(2)}</td>
                    <td>{order.payment_status}</td>
                    <td>{order.shipping_status || 'Pending'}</td>
                    <td>
                    <Link to={`/orders/${order.id}`} className="btn btn-sm btn-info me-2">View/Prep</Link>
                    {/* TODO: Add other actions like Mark Paid */}
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      )}
      {!loading && orders.length === 0 && <p>No orders found matching criteria.</p>}
    </div>
  );
};

export default OrderList;
