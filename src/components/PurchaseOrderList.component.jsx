import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import purchaseListService from '../services/purchaseList.service';

const PurchaseOrderList = () => {
  const { groupOrderId } = useParams();
  const [purchaseOrders, setPurchaseOrders] = useState([]);

  useEffect(() => {
    purchaseListService.getPurchaseOrdersForGroupOrder(groupOrderId)
      .then(response => {
        setPurchaseOrders(response.data);
      })
      .catch(error => {
        console.error("Error fetching purchase orders:", error);
      });
  }, [groupOrderId]);

  return (
    <div>
      <h2>Purchase Orders for Group Order {groupOrderId}</h2>
      {purchaseOrders.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Purchase Order ID</th>
              <th>Purchase Date</th>
              <th>Vendor</th>
              <th>Tracking Number</th>
            </tr>
          </thead>
          <tbody>
            {purchaseOrders.map(purchaseOrder => (
              <tr key={purchaseOrder.id}>
                <td>{purchaseOrder.id}</td>
                <td>{purchaseOrder.purchase_date}</td>
                <td>{purchaseOrder.vendor}</td>
                <td>{purchaseOrder.tracking_number}</td>
                {/* Display purchase order items here if needed */}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No purchase orders found for this group order.</p>
      )}
    </div>
  );
};

export default PurchaseOrderList;
