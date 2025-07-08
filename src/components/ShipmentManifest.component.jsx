import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import OrderService from '../services/order.service';

const ShipmentManifest = () => {
  const { group_order_id } = useParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const downloadCsvFile = (data, filename) => {
    const blob = new Blob([data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    a.click();
  };


  useEffect(() => {
    const fetchManifest = async () => {
      try {
        const response = await OrderService.getShipmentManifest(group_order_id);
        const shipmentManifestData = response.data;

    const groupOrdersByCustomerId = (orders) => {
      const groupedOrders = {};
      orders.forEach(order => {
        const customerId = order.customerName;
        if (!groupedOrders[customerId]) {
          groupedOrders[customerId] = {
            customerName: order.customerName,
            customerAddress: order.customerAddress,
            customerCity: order.customerCity,
            customerState: order.customerState,
            customerZip: order.customerZip,
            customerEmail: order.customerEmail,
            orderItems: []
          };
        }
        order.orderItems.forEach(item => {
          if (groupedOrders[customerId].orderItems.find(i => i.name === item.name)) {
            groupedOrders[customerId].orderItems.find(i => i.name === item.name).quantity += item.quantity;
          } else {
            groupedOrders[customerId].orderItems.push(item);
          }
        });
      });
      return Object.values(groupedOrders);
    };

    const groupedOrders = groupOrdersByCustomerId(shipmentManifestData);
    setOrders(groupedOrders);
  } catch (err) {
    setError(err.message || 'Failed to fetch shipment manifest');
  } finally {
    setLoading(false);
  }
};

    fetchManifest();
  }, [group_order_id]);

  if (loading) {
    return <div>Loading shipment manifest...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="container mt-3">
      <div>
<h2>Shipment Manifest for Group Order {group_order_id}</h2>
        <button className="btn btn-success me-2" onClick={() => handleExport('polymailer')}>Export Polymailers to CSV</button>
        <button className="btn btn-success" onClick={() => handleExport('box')}>Export Boxes to CSV</button>
        <ul>
          {orders.map((customer, index) => (
<li key={index}>
  <h3>Customer: {customer.customerName}</h3>
  <div>Total Items: {customer.orderItems.reduce((total, item) => total + item.quantity, 0)}</div>
  <ul>
    {customer.orderItems.map((item, itemIndex) => (
      <li key={itemIndex}>
        {item.name} x {item.quantity}
      </li>
    ))}
  </ul>
</li>
          ))}
        </ul>
      </div>
    </div>
  );

  function handleExport(packageType) {
    OrderService.exportCsv({ groupOrderId: group_order_id, packageCategory: packageType })
      .then(response => {
        const contentDisposition = response.headers['content-disposition'];
        let filename = `shipment_manifest_${group_order_id}.csv`;
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
          if (filenameMatch && filenameMatch.length === 2)
            filename = filenameMatch[1];
        }
        downloadCsvFile(response.data, filename);
      })
      .catch(error => {
        console.error("There was an error!", error);
      });
  }
};

export default ShipmentManifest;
