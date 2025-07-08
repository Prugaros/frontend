import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import purchaseListService from '../services/purchaseList.service';
import purchaseOrderService from '../services/purchaseOrder.service';
import AuthService from '../services/auth.service';
import axios from 'axios';

const GroupOrderPurchaseList = () => {
  const { groupOrderId } = useParams();
  const [purchaseList, setPurchaseList] = useState([]);
  const [purchasedQuantities, setPurchasedQuantities] = useState({});
  const [productNameMap, setProductNameMap] = useState({});

  useEffect(() => {
    purchaseListService.getPurchaseListForGroupOrder(groupOrderId)
      .then(response => {
        setPurchaseList(response.data);
      })
      .catch(error => {
        console.error("Error fetching purchase list for group order:", error);
      });
  }, [groupOrderId]);

  useEffect(() => {
    const fetchProductNames = async () => {
      const names = {};
      for (const item of purchaseList) {
        try {
          const user = AuthService.getCurrentUser();
          const token = user?.accessToken;
          const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/products/${item.productId}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          names[item.productId] = response.data.name;
        } catch (error) {
          console.error("Error fetching product name:", error);
          names[item.productId] = 'N/A';
        }
      }
      setProductNameMap(names);
    };

    if (purchaseList.length > 0) {
      fetchProductNames();
    }
  }, [purchaseList]);

  const handleQuantityChange = (productId, event) => {
    const value = parseInt(event.target.value, 10) || 0;
    setPurchasedQuantities({
      ...purchasedQuantities,
      [productId]: value
    });
  };

  const handleCreatePurchase = () => {
    const purchaseOrderItems = Object.entries(purchasedQuantities)
      .filter(([productId, quantity]) => quantity > 0)
      .map(([productId, quantity]) => ({
        product_id: parseInt(productId, 10),
        quantity: quantity
      }));

    if (purchaseOrderItems.length === 0) {
      alert("Please enter quantities for at least one item.");
      return;
    }

    purchaseOrderService.createPurchaseOrder(groupOrderId, purchaseOrderItems)
      .then(response => {
        alert("Purchase order created successfully!");
        purchaseListService.getPurchaseListForGroupOrder(groupOrderId)
          .then(response => {
            setPurchaseList(response.data);
          })
          .catch(error => {
            console.error("Error refreshing purchase list:", error);
          });
      })
      .catch(error => {
        console.error("Error creating purchase order:", error);
        alert("Error creating purchase order.");
      });
  };

  return (
    <div>
      <h2>Purchase List for Group Order {groupOrderId}</h2>
      {purchaseList.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Product ID</th>
              <th>Product Name</th>
              <th>Quantity</th>
              <th>Purchased Quantity</th>
            </tr>
          </thead>
          <tbody>
            {purchaseList.map(item => (
              <tr key={item.productId}>
                <td>{item.productId}</td>
                <td>{productNameMap[item.productId] || 'Loading...'}</td>
                <td>{item.quantity}</td>
                <td>
                  <input
                    type="number"
                    value={purchasedQuantities[item.productId] || 0}
                    onChange={(event) => handleQuantityChange(item.productId, event)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No items in the purchase list for this group order.</p>
      )}
      <button onClick={handleCreatePurchase}>Create Purchase</button>
      <Link to={`/purchase-orders/${groupOrderId}`}>
        <button>Purchases</button>
      </Link>
    </div>
  );
};

export default GroupOrderPurchaseList;
