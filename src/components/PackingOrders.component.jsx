import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import OrderService from '../services/order.service';

const activeButtonStyle = {
  backgroundColor: '#2c96f1ff',
  border: '1px solid #999',
  padding: '10px 15px',
  margin: '5px',
  cursor: 'pointer',
  fontSize: '16px'
};
const inactiveButtonStyle = {
  backgroundColor: 'gray',
  border: '1px solid #ccc',
  padding: '10px 15px',
  margin: '5px',
  cursor: 'pointer',
  fontSize: '16px'
};

const buttonContainerStyle = {
  marginBottom: '10px'
};

const PackingOrders = () => {
  const { group_order_id } = useParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [packed, setPacked] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [packageType, setPackageType] = useState('polymailer'); // Default to polymailer
  const [packageLength, setPackageLength] = useState('');
  const [packageWidth, setPackageWidth] = useState('');
  const [packageHeight, setPackageHeight] = useState('');
  const [totalWeightOz, setTotalWeightOz] = useState('');
  const [polymailerSize, setPolymailerSize] = useState('');
  const [boxType, setBoxType] = useState('');


  // Helper function to process and sort orders
  const processAndSortOrders = (orders) => {
    // Group orders by customer, filtering out packed orders
    const groupedOrders = {};
    orders.filter(order => order.shipping_status !== 'Packed').forEach(order => {
      const customerId = order.customer.id;
      if (!groupedOrders[customerId]) {
        groupedOrders[customerId] = {
          customer: order.customer,
          orders: [],
          firstPaymentTime: new Date(order.updatedAt) // Initialize with the first order's time
        };
      } else {
        // Update if the current order's payment is earlier
        const orderPaymentTime = new Date(order.updatedAt);
        if (orderPaymentTime < groupedOrders[customerId].firstPaymentTime) {
          groupedOrders[customerId].firstPaymentTime = orderPaymentTime;
        }
      }
      groupedOrders[customerId].orders.push(order);
    });

    // Sort customers based on their first payment time
    const sortedCustomers = Object.values(groupedOrders).sort((a, b) => {
      return a.firstPaymentTime - b.firstPaymentTime;
    });

    return sortedCustomers;
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await OrderService.getAll({ groupOrderId: group_order_id });
        setOrders(response.data);
        const sortedCustomers = processAndSortOrders(response.data);
        setCustomers(sortedCustomers);
      } catch (err) {
        setError(err.message || 'Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [group_order_id, packed]);

  const handleCompleteOrder = async (customer) => {
    try {
      // Validate input
      if (!packageType) {
        setError('Package type is required.');
        return;
      }

      // Collect order IDs
      const orderIds = customer.orders.map(order => order.id);

      // Submit packing information to backend for all orders in the manifest
      await OrderService.updateShippingManifest(group_order_id, {
        order_ids: orderIds, // Pass all order IDs in the request body
        customer_id: customer.customer.id, // Pass the customer ID in the request body
        package_type: packageType,
        package_length: packageLength || null,
        package_width: packageWidth || null,
        package_height: packageHeight || null,
        total_weight_oz: parseFloat(totalWeightOz) || null
      });

      // Refresh orders after packing
      const response = await OrderService.getAll({ groupOrderId: group_order_id });
      setOrders(response.data);
      const sortedCustomers = processAndSortOrders(response.data);
      setCustomers(sortedCustomers);
      setPacked(!packed); // Toggle the packed state
    } catch (err) {
      setError(err.message || 'Failed to update shipping details');
    }
  };

  if (loading) {
    return <div>Loading orders...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const getTotalQuantity = (orders) => {
    return orders.reduce((total, order) => {
      return total + order.orderItems.reduce((orderTotal, item) => {
        return orderTotal + item.quantity;
      }, 0);
    }, 0);
  };

  return (
    <div>
      <h2>Packing Orders for Group Order {group_order_id}</h2>
      <Link to={`/shipment-manifest/${group_order_id}`}>Shipment Manifest</Link>
      {packed && <p>All Orders Packed! Continue to <Link to={`/shipment-manifest/${group_order_id}`}>Shipment Manifest</Link></p>}
      {customers.map(customer => (
        <div key={customer.customer.id}>
          <h3>Customer: {customer.customer.name}</h3>
          <p>Total Quantity: {getTotalQuantity(customer.orders)}</p>
          <h4>Items:</h4>
          <ul>
            {customer.orders.map(order => (
              order.orderItems.map(item => (
                <li key={item.id}>
                  {item.orderProduct.name} (Quantity: {item.quantity})
                </li>
              ))
            ))}
          </ul>
          <div>
            <h4>Shipping Information</h4>
            <div style={buttonContainerStyle}>
              <button
                style={packageType === 'polymailer' ? activeButtonStyle : inactiveButtonStyle}
                onClick={() => {
                  setPackageType('polymailer');
                  setPolymailerSize('');
                  setBoxType('');
                  setPackageLength('');
                  setPackageWidth('');
                  setPackageHeight('');
                }}>Polymailer</button>
              <button
                style={packageType === 'box' ? activeButtonStyle : inactiveButtonStyle}
                onClick={() => {
                  setPackageType('box');
                  setBoxType('standard');
                  setPolymailerSize('');
                  setPackageLength('6');
                  setPackageWidth('6');
                  setPackageHeight('6');
                }}>Box</button>
            </div>

            {packageType === 'polymailer' && (
              <div style={buttonContainerStyle}>
                <button
                  style={polymailerSize === 'small' ? activeButtonStyle : inactiveButtonStyle}
                  onClick={() => { setPolymailerSize('small'); setPackageLength('6'); setPackageWidth('10'); setPackageHeight(''); }}>Small</button>
                <button
                  style={polymailerSize === 'medium' ? activeButtonStyle : inactiveButtonStyle}
                  onClick={() => { setPolymailerSize('medium'); setPackageLength('8.5'); setPackageWidth('12'); setPackageHeight(''); }}>Medium</button>
                <button
                  style={polymailerSize === 'large' ? activeButtonStyle : inactiveButtonStyle}
                  onClick={() => { setPolymailerSize('large'); setPackageLength('10.5'); setPackageWidth('16'); setPackageHeight(''); }}>Large</button>
              </div>
            )}

            {packageType === 'box' && (
              <div style={buttonContainerStyle}>
                <button
                  style={boxType === 'standard' ? activeButtonStyle : inactiveButtonStyle}
                  onClick={() => { setBoxType('standard'); setPackageLength('6'); setPackageWidth('6'); setPackageHeight('6'); }}>Standard</button>
                <button
                  style={boxType === 'custom' ? activeButtonStyle : inactiveButtonStyle}
                  onClick={() => { setBoxType('custom'); setPackageLength(''); setPackageWidth(''); setPackageHeight(''); }}>Custom</button>
              </div>
            )}

            <br />
            <label>
              Length:
              <input type="number" value={packageLength} onChange={e => setPackageLength(e.target.value)} disabled={packageType === 'polymailer' || boxType === 'standard'} />
            </label>
            <br />
            <label>
              Width:
              <input type="number" value={packageWidth} onChange={e => setPackageWidth(e.target.value)} disabled={packageType === 'polymailer' || boxType === 'standard'} />
            </label>
            <br />
            <label>
              Height:
              <input type="number" value={packageHeight} onChange={e => setPackageHeight(e.target.value)} disabled={packageType === 'polymailer' || boxType === 'standard'} />
            </label>
            <br />
            <label>
              Weight (oz):
              <input type="number" value={totalWeightOz} onChange={e => setTotalWeightOz(e.target.value)} />
            </label>
            <br />
            <button onClick={() => handleCompleteOrder(customer)}>Complete {customer.customer.name}'s Order</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PackingOrders;
