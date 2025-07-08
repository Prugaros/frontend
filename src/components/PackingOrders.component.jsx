import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import OrderService from '../services/order.service';

const PackingOrders = () => {
  const { group_order_id } = useParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [packed, setPacked] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [packageType, setPackageType] = useState('');
  const [packageLength, setPackageLength] = useState('');
  const [packageWidth, setPackageWidth] = useState('');
  const [packageHeight, setPackageHeight] = useState('');
  const [totalWeightOz, setTotalWeightOz] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await OrderService.getAll({ groupOrderId: group_order_id });
        setOrders(response.data);

        // Group orders by customer, filtering out packed orders
        const groupedOrders = {};
        response.data.filter(order => order.shipping_status !== 'Packed').forEach(order => {
          const customerId = order.customer.id;
          if (!groupedOrders[customerId]) {
            groupedOrders[customerId] = {
              customer: order.customer,
              orders: []
            };
          }
          groupedOrders[customerId].orders.push(order);
        });
        setCustomers(Object.values(groupedOrders));
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

      // Update the customer list, filtering out packed orders
      const groupedOrders = {};
      response.data.filter(order => order.shipping_status !== 'Packed').forEach(order => {
        const customerId = order.customer.id;
        if (!groupedOrders[customerId]) {
          groupedOrders[customerId] = {
            customer: order.customer,
            orders: []
          };
        }
        groupedOrders[customerId].orders.push(order);
      });
      setCustomers(Object.values(groupedOrders));

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

  return (
    <div>
      <h2>Packing Orders for Group Order {group_order_id}</h2>
      <Link to={`/shipment-manifest/${group_order_id}`}>Shipment Manifest</Link>
      {packed && <p>All Orders Packed! Continue to <Link to={`/shipment-manifest/${group_order_id}`}>Shipment Manifest</Link></p>}
      {customers.map(customer => (
        <div key={customer.customer.id}>
          <h3>Customer: {customer.customer.name}</h3>
          <p>Customer ID: {customer.customer.id}</p>
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
            <label>
              Package Type:
              <select value={packageType} onChange={e => setPackageType(e.target.value)}>
                <option value="">Select Package Type</option>
                <option value="polymailer">Polymailer</option>
                <option value="box">Box</option>
                <option value="custom">Custom</option>
              </select>
            </label>
            <br />
            <label>
              Length:
              <input type="number" value={packageLength} onChange={e => setPackageLength(e.target.value)} />
            </label>
            <br />
            <label>
              Width:
              <input type="number" value={packageWidth} onChange={e => setPackageWidth(e.target.value)} />
            </label>
            <br />
            <label>
              Height:
              <input type="number" value={packageHeight} onChange={e => setPackageHeight(e.target.value)} />
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
