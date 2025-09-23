import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import OrderService from '../services/order.service';

const activeButtonStyle = {
  backgroundColor: '#2c96f1ff',
  border: '1px solid #999',
  padding: '10px 15px',
  margin: '5px',
  cursor: 'pointer',
  fontSize: '16px',
  color: 'white'
};
const inactiveButtonStyle = {
  backgroundColor: 'gray',
  border: '1px solid #ccc',
  padding: '10px 15px',
  margin: '5px',
  cursor: 'pointer',
  fontSize: '16px',
  color: 'white'
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
  const [materialSummary, setMaterialSummary] = useState({});
  const [packingDetails, setPackingDetails] = useState({});
  const [isMaterialSummaryCollapsed, setIsMaterialSummaryCollapsed] = useState(true);


  const getSuggestedPackaging = (totalItems) => {
    if (totalItems >= 1 && totalItems <= 2) {
      return { packageType: 'polymailer', polymailerSize: 'small', packageLength: '6', packageWidth: '10', packageHeight: '' };
    } else if (totalItems >= 3 && totalItems <= 6) {
      return { packageType: 'polymailer', polymailerSize: 'medium', packageLength: '8.5', packageWidth: '12', packageHeight: '' };
    } else if (totalItems >= 7 && totalItems <= 13) {
      return { packageType: 'polymailer', polymailerSize: 'large', packageLength: '10.5', packageWidth: '16', packageHeight: '' };
    } else if (totalItems >= 14 && totalItems <= 18) {
      return { packageType: 'box', boxType: 'standard', packageLength: '6', packageWidth: '6', packageHeight: '6' };
    } else if (totalItems > 18) {
      return { packageType: 'box', boxType: 'custom', packageLength: '', packageWidth: '', packageHeight: '' };
    }
    return { packageType: 'polymailer', polymailerSize: '', packageLength: '', packageWidth: '', packageHeight: '', boxType: '' };
  };

  const handlePackingDetailChange = (customerId, field, value) => {
    setPackingDetails(prevDetails => ({
      ...prevDetails,
      [customerId]: {
        ...prevDetails[customerId],
        [field]: value
      }
    }));
  };

  const updatePackingDetails = (customerId, newDetails) => {
    setPackingDetails(prevDetails => ({
      ...prevDetails,
      [customerId]: {
        ...prevDetails[customerId],
        ...newDetails
      }
    }));
  };

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

  const getTotalQuantity = (orders) => {
    return orders.reduce((total, order) => {
      return total + order.orderItems
        .filter(item => item.status !== 'Refunded')
        .reduce((orderTotal, item) => {
          return orderTotal + item.quantity;
        }, 0);
    }, 0);
  };

  const groupAllPaidOrdersByCustomer = (orders) => {
    const groupedOrders = {};
    orders.forEach(order => {
      const customerId = order.customer.id;
      if (!groupedOrders[customerId]) {
        groupedOrders[customerId] = {
          customer: order.customer,
          orders: []
        };
      }
      groupedOrders[customerId].orders.push(order);
    });
    return Object.values(groupedOrders);
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await OrderService.getAll({ groupOrderId: group_order_id, paymentStatus: 'Paid' });
        const allPaidOrders = response.data;
        setOrders(allPaidOrders);

        const allPaidCustomers = groupAllPaidOrdersByCustomer(allPaidOrders);
        const summary = {
          'small poly': 0,
          'medium poly': 0,
          'large poly': 0,
          'normal box': 0,
          'custom box': 0,
        };

        allPaidCustomers.forEach(customer => {
          const totalItems = getTotalQuantity(customer.orders);
          if (totalItems >= 1 && totalItems <= 2) {
            summary['small poly']++;
          } else if (totalItems >= 3 && totalItems <= 6) {
            summary['medium poly']++;
          } else if (totalItems >= 7 && totalItems <= 13) {
            summary['large poly']++;
          } else if (totalItems >= 14 && totalItems <= 18) {
            summary['normal box']++;
          } else if (totalItems > 18) {
            summary['custom box']++;
          }
        });
        setMaterialSummary(summary);

        const sortedCustomers = processAndSortOrders(allPaidOrders);
        setCustomers(sortedCustomers);

        const initialPackingDetails = {};
        sortedCustomers.forEach(customer => {
          const totalItems = getTotalQuantity(customer.orders);
          const suggestedPackaging = getSuggestedPackaging(totalItems);
          initialPackingDetails[customer.customer.id] = {
            ...suggestedPackaging,
            totalWeightOz: ''
          };
        });
        setPackingDetails(initialPackingDetails);
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
      const customerId = customer.customer.id;
      const details = packingDetails[customerId];

      // Validate input
      if (!details.packageType) {
        setError('Package type is required.');
        return;
      }

      // Collect order IDs
      const orderIds = customer.orders.map(order => order.id);

      // Submit packing information to backend for all orders in the manifest
      await OrderService.updateShippingManifest(group_order_id, {
        order_ids: orderIds, // Pass all order IDs in the request body
        customer_id: customerId, // Pass the customer ID in the request body
        package_type: details.packageType,
        package_length: details.packageLength || null,
        package_width: details.packageWidth || null,
        package_height: details.packageHeight || null,
        total_weight_oz: parseFloat(details.totalWeightOz) || null
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

  return (
    <div>
      <h2>Packing Orders for Group Order {group_order_id}</h2>
      <div className="card my-3">
        <div className="card-header" onClick={() => setIsMaterialSummaryCollapsed(!isMaterialSummaryCollapsed)} style={{ cursor: 'pointer' }}>
          Material Summary {isMaterialSummaryCollapsed ? '▼' : '▲'}
        </div>
        {!isMaterialSummaryCollapsed && (
          <ul className="list-group list-group-flush">
            {Object.entries(materialSummary).map(([material, count]) => (
              <li key={material} className="list-group-item d-flex justify-content-between align-items-center">
                {material.charAt(0).toUpperCase() + material.slice(1)}
                <span className="badge bg-primary rounded-pill">{count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Link to={`/shipment-manifest/${group_order_id}`}>Shipment Manifest</Link>
      {packed && <p>All Orders Packed! Continue to <Link to={`/shipment-manifest/${group_order_id}`}>Shipment Manifest</Link></p>}
      {customers.map(customer => (
        <div key={customer.customer.id}>
          <h3>Customer: {customer.customer.name}</h3>
          <p>Total Quantity: {getTotalQuantity(customer.orders)}</p>
          <h4>Items:</h4>
          <ul>
            {customer.orders.map(order => (
              order.orderItems
                .filter(item => item.status !== 'Refunded')
                .map(item => (
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
                style={packingDetails[customer.customer.id]?.packageType === 'polymailer' ? activeButtonStyle : inactiveButtonStyle}
                onClick={() => {
                  updatePackingDetails(customer.customer.id, {
                    packageType: 'polymailer',
                    polymailerSize: '',
                    boxType: '',
                    packageLength: '',
                    packageWidth: '',
                    packageHeight: ''
                  });
                }}>Polymailer</button>
              <button
                style={packingDetails[customer.customer.id]?.packageType === 'box' ? activeButtonStyle : inactiveButtonStyle}
                onClick={() => {
                  updatePackingDetails(customer.customer.id, {
                    packageType: 'box',
                    boxType: 'standard',
                    polymailerSize: '',
                    packageLength: '6',
                    packageWidth: '6',
                    packageHeight: '6'
                  });
                }}>Box</button>
            </div>

            {packingDetails[customer.customer.id]?.packageType === 'polymailer' && (
              <div style={buttonContainerStyle}>
                <button
                  style={packingDetails[customer.customer.id]?.polymailerSize === 'small' ? activeButtonStyle : inactiveButtonStyle}
                  onClick={() => updatePackingDetails(customer.customer.id, { polymailerSize: 'small', packageLength: '6', packageWidth: '10', packageHeight: '' })}>Small</button>
                <button
                  style={packingDetails[customer.customer.id]?.polymailerSize === 'medium' ? activeButtonStyle : inactiveButtonStyle}
                  onClick={() => updatePackingDetails(customer.customer.id, { polymailerSize: 'medium', packageLength: '8.5', packageWidth: '12', packageHeight: '' })}>Medium</button>
                <button
                  style={packingDetails[customer.customer.id]?.polymailerSize === 'large' ? activeButtonStyle : inactiveButtonStyle}
                  onClick={() => updatePackingDetails(customer.customer.id, { polymailerSize: 'large', packageLength: '10.5', packageWidth: '16', packageHeight: '' })}>Large</button>
              </div>
            )}

            {packingDetails[customer.customer.id]?.packageType === 'box' && (
              <div style={buttonContainerStyle}>
                <button
                  style={packingDetails[customer.customer.id]?.boxType === 'standard' ? activeButtonStyle : inactiveButtonStyle}
                  onClick={() => updatePackingDetails(customer.customer.id, { boxType: 'standard', packageLength: '6', packageWidth: '6', packageHeight: '6' })}>Standard</button>
                <button
                  style={packingDetails[customer.customer.id]?.boxType === 'custom' ? activeButtonStyle : inactiveButtonStyle}
                  onClick={() => updatePackingDetails(customer.customer.id, { boxType: 'custom', packageLength: '', packageWidth: '', packageHeight: '' })}>Custom</button>
              </div>
            )}

            <br />
            <label>
              Length:
              <input type="number" value={packingDetails[customer.customer.id]?.packageLength || ''} onChange={e => handlePackingDetailChange(customer.customer.id, 'packageLength', e.target.value)} disabled={packingDetails[customer.customer.id]?.packageType === 'polymailer' || packingDetails[customer.customer.id]?.boxType === 'standard'} />
            </label>
            <br />
            <label>
              Width:
              <input type="number" value={packingDetails[customer.customer.id]?.packageWidth || ''} onChange={e => handlePackingDetailChange(customer.customer.id, 'packageWidth', e.target.value)} disabled={packingDetails[customer.customer.id]?.packageType === 'polymailer' || packingDetails[customer.customer.id]?.boxType === 'standard'} />
            </label>
            <br />
            <label>
              Height:
              <input type="number" value={packingDetails[customer.customer.id]?.packageHeight || ''} onChange={e => handlePackingDetailChange(customer.customer.id, 'packageHeight', e.target.value)} disabled={packingDetails[customer.customer.id]?.packageType === 'polymailer' || packingDetails[customer.customer.id]?.boxType === 'standard'} />
            </label>
            <br />
            <label>
              Weight (oz):
              <input type="number" value={packingDetails[customer.customer.id]?.totalWeightOz || ''} onChange={e => handlePackingDetailChange(customer.customer.id, 'totalWeightOz', e.target.value)} />
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
