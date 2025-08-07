import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import purchaseListService from '../services/purchaseList.service';

const PurchaseOrderList = () => {
  const { groupOrderId } = useParams();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    purchaseListService.getPurchaseOrdersForGroupOrder(groupOrderId)
      .then(response => {
        setPurchaseOrders(response.data);
      })
      .catch(error => {
        console.error("Error fetching purchase orders:", error);
      });
  }, [groupOrderId]);

  const toggleExpandedOrder = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  return (
    <div>
      <h2>Purchase Orders for Group Order {groupOrderId}</h2>
      {purchaseOrders.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Purchase Order ID</th>
              <th>Purchase Date</th>
              <th>Vendor</th>
              <th>Tracking Number</th>
            </tr>
          </thead>
          <tbody>
            {purchaseOrders.map(purchaseOrder => (
              <React.Fragment key={purchaseOrder.id}>
                <tr>
                  <td>
                    <button onClick={() => toggleExpandedOrder(purchaseOrder.id)}>
                      {expandedOrderId === purchaseOrder.id ? '-' : '+'}
                    </button>
                  </td>
                  <td>{purchaseOrder.id}</td>
                  <td>{new Date(purchaseOrder.purchase_date).toLocaleDateString()}</td>
                  <td>{purchaseOrder.vendor}</td>
                  <td>{purchaseOrder.tracking_number}</td>
                </tr>
                {expandedOrderId === purchaseOrder.id && (
                  <tr>
                    <td colSpan="5">
                      <h4>Items for Purchase Order {purchaseOrder.id}</h4>
                      <table>
                        <thead>
                          <tr>
                            <th>Brand</th>
                            <th>Product Name</th>
                            <th>Quantity</th>
                          </tr>
                        </thead>
                        <tbody>
                          {purchaseOrder.purchaseOrderItems.map(item => (
                            <tr key={item.id}>
                              <td>{item.purchasedProduct.brand ? item.purchasedProduct.brand.name : 'N/A'}</td>
                              <td>{item.purchasedProduct.name}</td>
                              <td>{item.quantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </React.Fragment>
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
