import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import purchaseListService from '../services/purchaseList.service';

const PurchaseList = () => {
  const [groupOrders, setGroupOrders] = useState([]);

  useEffect(() => {
    purchaseListService.getGroupOrders()
      .then(response => {
        setGroupOrders(response.data);
      })
      .catch(error => {
        console.error("Error fetching group orders:", error);
      });
  }, []);

  return (
    <div>
      <h2>Purchase List</h2>
      {groupOrders.length > 0 ? (
        <ul>
          {groupOrders.map(groupOrder => (
            <li key={groupOrder.id}>
              {groupOrder.name}
              <Link to={`/purchase-list/${groupOrder.id}`}>
                <button>List</button>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>No group orders found.</p>
      )}
    </div>
  );
};

export default PurchaseList;
