import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import inventoryService from '../services/inventory.service';

const ShipmentIntake = () => {
  const { groupOrderId } = useParams();
  const [shipmentIntakeList, setShipmentIntakeList] = useState([]);
  const [receivedQuantities, setReceivedQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchShipmentIntakeList();
  }, [groupOrderId]);

  const fetchShipmentIntakeList = async () => {
    setLoading(true);
    try {
      const response = await inventoryService.getShipmentIntakeList(groupOrderId);
      setShipmentIntakeList(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching shipment intake list:", error);
      setMessage(error.response?.data?.message || error.message || "Error fetching shipment intake list");
      setLoading(false);
    }
  };

  const handleQuantityChange = (productId, event) => {
    const value = parseInt(event.target.value, 10) || 0;
    setReceivedQuantities(prevQuantities => ({
      ...prevQuantities,
      [productId]: value,
    }));
  };

  const handleSubmitShipmentIntake = async () => {
    setLoading(true);
    setMessage('');
    try {
      const receivedItems = Object.entries(receivedQuantities).map(([productId, quantity]) => ({
        productId: parseInt(productId, 10),
        quantity: quantity,
      }));

      await inventoryService.shipmentIntake(groupOrderId, receivedItems);
      setMessage('Shipment intake submitted successfully!');
      await fetchShipmentIntakeList();
      setReceivedQuantities({}); // Clear received quantities
      setLoading(false);
    } catch (error) {
      console.error("Error submitting shipment intake:", error);
      setMessage(error.response?.data?.message || error.message || "Error submitting shipment intake");
      setLoading(false);
    }
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px',
  };

  const thStyle = {
    backgroundColor: '#f2f2f2',
    border: '1px solid #ddd',
    padding: '8px',
    textAlign: 'left',
  };

  const tdStyle = {
    border: '1px solid #ddd',
    padding: '8px',
    textAlign: 'left'
  };

  const inputStyle = {
    width: '80px',
    padding: '5px',
    border: '1px solid #ccc',
    borderRadius: '4px',
  };

  const buttonStyle = {
    backgroundColor: '#4CAF50',
    border: 'none',
    color: 'white',
    padding: '10px 20px',
    textAlign: 'center',
    textDecoration: 'none',
    display: 'inline-block',
    fontSize: '16px',
    margin: '4px 2px',
    cursor: 'pointer',
    borderRadius: '5px',
  };

  const shortedItems = shipmentIntakeList.filter(item => item.difference < 0);
  const surplusItems = shipmentIntakeList.filter(item => item.difference > 0);
  const matchedItems = shipmentIntakeList.filter(item => item.difference === 0);

  return (
    <div>
      <h2>Shipment Intake for Group Order {groupOrderId}</h2>
      {message && <div className="alert alert-danger">{message}</div>}

      {/* Shorted Items Table */}
      <h3>Items Still Needed</h3>
      {shortedItems.length > 0 ? (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Product ID</th>
              <th style={thStyle}>Product Name</th>
              <th style={thStyle}>Ordered Quantity</th>
              <th style={thStyle}>Received Quantity</th>
            </tr>
          </thead>
          <tbody>
            {shortedItems.map((item) => (
              <tr key={item.productId}>
                <td style={tdStyle}>{item.productId}</td>
                <td style={tdStyle}>{item.name}</td>
                <td style={tdStyle}>{item.quantity}</td>
                <td style={tdStyle}>
                  <input
                    type="number"
                    style={inputStyle}
                    value={receivedQuantities[item.productId] || ''}
                    onChange={(event) => handleQuantityChange(item.productId, event)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No items are shorted.</p>
      )}
      <button style={buttonStyle} onClick={handleSubmitShipmentIntake}>Submit Shipment Intake</button>

      {/* Surplus Items Table */}
      <h3>Surplus Items</h3>
      {surplusItems.length > 0 ? (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Product ID</th>
              <th style={thStyle}>Product Name</th>
              <th style={thStyle}>Surplus</th>
              <th style={thStyle}>Received Quantity</th>
            </tr>
          </thead>
          <tbody>
            {surplusItems.map((item) => (
              <tr key={item.productId}>
                <td style={tdStyle}>{item.productId}</td>
                <td style={tdStyle}>{item.name}</td>
                <td style={tdStyle}>{item.difference}</td>
                <td style={tdStyle}>
                  <input
                    type="number"
                    style={inputStyle}
                    value={receivedQuantities[item.productId] || ''}
                    onChange={(event) => handleQuantityChange(item.productId, event)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No items are surplus.</p>
      )}

      {/* Matched Items Table */}
      <h3>Matched Items</h3>
      {matchedItems.length > 0 ? (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Product ID</th>
              <th style={thStyle}>Product Name</th>
              <th style={thStyle}>Difference</th>
              <th style={thStyle}>Received Quantity</th>
            </tr>
          </thead>
          <tbody>
            {matchedItems.map((item) => (
              <tr key={item.productId}>
                <td style={tdStyle}>{item.productId}</td>
                <td style={tdStyle}>{item.name}</td>
                <td style={tdStyle}>{item.quantity}</td>
                <td style={tdStyle}>
                  <input
                    type="number"
                    style={inputStyle}
                    value={receivedQuantities[item.productId] || ''}
                    onChange={(event) => handleQuantityChange(item.productId, event)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No items are perfectly matched.</p>
      )}

    </div>
  );
};

export default ShipmentIntake;
