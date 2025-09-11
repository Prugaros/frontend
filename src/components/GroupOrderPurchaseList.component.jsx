import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import purchaseListService from '../services/purchaseList.service';
import purchaseOrderService from '../services/purchaseOrder.service';

const GroupOrderPurchaseList = () => {
  const { groupOrderId } = useParams();
  const [purchaseList, setPurchaseList] = useState([]);
  const [purchasedQuantities, setPurchasedQuantities] = useState({});
  const [groupedPurchaseList, setGroupedPurchaseList] = useState({});
  const [discounts, setDiscounts] = useState({});
  const [accountBalance, setAccountBalance] = useState(0);
  const [outOfStockItems, setOutOfStockItems] = useState({});

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
    const grouped = purchaseList.reduce((acc, item) => {
      let group = item.group || 'Unknown Brand';
      if (item.brandName === 'Ohora' && item.isDisneyStore) {
        group = 'Ohora - Disney Store';
      }
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(item);
      return acc;
    }, {});
    setGroupedPurchaseList(grouped);
  }, [purchaseList]);

  const handleQuantityChange = (productId, event) => {
    const value = parseInt(event.target.value, 10) || 0;
    setPurchasedQuantities({
      ...purchasedQuantities,
      [productId]: value
    });
  };

  const handleDiscountChange = (group, type, value) => {
    setDiscounts({
      ...discounts,
      [group]: {
        ...discounts[group],
        [type]: parseFloat(value) || 0
      }
    });
  };

  const handleOutOfStockChange = (productId) => {
    setOutOfStockItems(prevState => ({
      ...prevState,
      [productId]: !prevState[productId]
    }));
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
        setPurchasedQuantities({});
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

  const calculateGroupTotal = (items) => {
    return items.reduce((total, item) => {
      if (outOfStockItems[item.productId]) {
        return total;
      }
      return total + (item.MSRP * item.quantity);
    }, 0);
  };

  const calculateGroupQuantity = (items) => {
    return items.reduce((total, item) => {
      if (outOfStockItems[item.productId]) {
        return total;
      }
      return total + item.quantity;
    }, 0);
  };

  const calculateTotalMSRP = () => {
    return Object.values(groupedPurchaseList).flat().reduce((total, item) => {
      if (outOfStockItems[item.productId]) {
        return total;
      }
      return total + (item.MSRP * item.quantity);
    }, 0);
  };

  const calculateTotalQuantity = () => {
    return Object.values(groupedPurchaseList).flat().reduce((total, item) => {
      if (outOfStockItems[item.productId]) {
        return total;
      }
      return total + item.quantity;
    }, 0);
  };

  const calculateTotalDiscount = () => {
    let totalDiscount = 0;
    for (const group in discounts) {
      const groupTotal = calculateGroupTotal(groupedPurchaseList[group]);
      const { flat = 0, percentage = 0 } = discounts[group];
      totalDiscount += flat;
      totalDiscount += groupTotal * (percentage / 100);
    }
    return totalDiscount;
  };

  const totalMSRP = calculateTotalMSRP();
  const totalDiscount = calculateTotalDiscount();
  const amountNeeded = totalMSRP - totalDiscount - accountBalance;
  const totalQuantity = calculateTotalQuantity();

  return (
    <div>
      <h2>Purchase List for Group Order {groupOrderId}</h2>
      {Object.keys(groupedPurchaseList).length > 0 ? (
        Object.entries(groupedPurchaseList).map(([group, items]) => (
          <div key={group}>
            <h3>{group}</h3>
            <table>
              <thead>
                <tr>
                  <th>Product ID</th>
                  <th>Product Name</th>
                  <th>Quantity</th>
                  <th>MSRP</th>
                  <th>Purchased Quantity</th>
                  <th>Out of Stock</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.productId}>
                    <td>{item.productId}</td>
                    <td>
                      <a href={item.product_url} target="_blank" rel="noopener noreferrer">
                        {item.name}
                      </a>
                    </td>
                    <td>{item.quantity}</td>
                    <td>{item.MSRP}</td>
                    <td>
                      <input
                        type="number"
                        value={purchasedQuantities[item.productId] || 0}
                        onChange={(event) => handleQuantityChange(item.productId, event)}
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={outOfStockItems[item.productId] || false}
                        onChange={() => handleOutOfStockChange(item.productId)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div>
              <strong>Group Total Quantity: {calculateGroupQuantity(items)}</strong>
              <br />
              <strong>Group Total MSRP: {calculateGroupTotal(items)}</strong>
            </div>
            <div>
              <label>Flat Discount: </label>
              <input
                type="number"
                onChange={(e) => handleDiscountChange(group, 'flat', e.target.value)}
              />
            </div>
            <div>
              <label>Percentage Discount: </label>
              <input
                type="number"
                onChange={(e) => handleDiscountChange(group, 'percentage', e.target.value)}
              />
            </div>
          </div>
        ))
      ) : (
        <p>No items in the purchase list for this group order.</p>
      )}
      <div>
        <h3>Cost Calculator</h3>
        <p>Total Quantity to Purchase: {totalQuantity}</p>
        <p>Total MSRP: {totalMSRP}</p>
        <p>Total Discounts: {totalDiscount.toFixed(2)}</p>
        <div>
          <label>Account Balance: </label>
          <input
            type="number"
            value={accountBalance}
            onChange={(e) => setAccountBalance(parseFloat(e.target.value) || 0)}
          />
        </div>
        <p>Amount Needed to Transfer: {amountNeeded.toFixed(2)}</p>
      </div>
      <button onClick={handleCreatePurchase}>Create Purchase</button>
      <Link to={`/purchase-orders/${groupOrderId}`}>
        <button>Purchases</button>
      </Link>
    </div>
  );
};

export default GroupOrderPurchaseList;
