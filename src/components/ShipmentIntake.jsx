import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import inventoryService from '../services/inventory.service';
import './ShipmentIntake.component.css'; // Import the new CSS file

const ShipmentIntake = () => {
  const { groupOrderId } = useParams();
  const [shipmentIntakeList, setShipmentIntakeList] = useState([]);
  const [loading, setLoading] = useState(true); // Keep loading for initial fetch
  const [adjustingProductId, setAdjustingProductId] = useState(null);
  const [adjustedQuantity, setAdjustedQuantity] = useState(0);

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
      // No message for error, just log
      setLoading(false);
    }
  };

  const handleApprove = async (productId, orderedQuantity) => {
    // setLoading(true); // Removed to prevent screen jump
    // setMessage(''); // Removed as per user request
    try {
      const receivedItems = [{
        productId: productId,
        quantity: orderedQuantity,
      }];

      await inventoryService.shipmentIntake(groupOrderId, receivedItems);
      // Update local state to remove the approved item (as its quantity is now 0)
      setShipmentIntakeList(prevList => prevList.filter(item => item.productId !== productId));
      // setLoading(false); // Removed to prevent screen jump
    } catch (error) {
      console.error("Error approving shipment intake:", error);
      // setMessage(error.response?.data?.message || error.message || "Error approving shipment intake"); // Removed as per user request
      // setLoading(false); // Removed to prevent screen jump
    }
  };

  const handleAdjustClick = (productId, currentQuantity) => {
    setAdjustingProductId(productId);
    setAdjustedQuantity(currentQuantity); // Pre-fill with current ordered quantity
  };

  const handleAdjustQuantityChange = (event) => {
    setAdjustedQuantity(parseInt(event.target.value, 10) || 0);
  };

  const handleSubmitAdjustedQuantity = async (productId) => {
    // setLoading(true); // Removed to prevent screen jump
    // setMessage(''); // Removed as per user request
    try {
      const receivedItems = [{
        productId: productId,
        quantity: adjustedQuantity,
      }];

      await inventoryService.shipmentIntake(groupOrderId, receivedItems);
      setShipmentIntakeList(prevList => {
        const updatedList = prevList.map(item => {
          if (item.productId === productId) {
            const newRemainingQuantity = item.quantity - adjustedQuantity;
            return { ...item, quantity: newRemainingQuantity };
          }
          return item;
        });
        return updatedList.filter(item => item.quantity > 0); // Filter out items with 0 quantity
      });
      setAdjustingProductId(null); // Hide input
      setAdjustedQuantity(0); // Reset quantity
      // setLoading(false); // Removed to prevent screen jump
    } catch (error) {
      console.error("Error adjusting shipment intake quantity:", error);
      // setMessage(error.response?.data?.message || error.message || "Error adjusting shipment intake quantity"); // Removed as per user request
      // setLoading(false); // Removed to prevent screen jump
    }
  };

  // Grouping logic
  const groupedItems = useMemo(() => {
    const brands = {};
    shipmentIntakeList.forEach(item => {
      // Only include items with an ordered quantity greater than 0
      if (item.quantity <= 0) {
        return;
      }

      const brandName = item.brand?.name || 'Unbranded';
      const collectionName = item.collection?.name || 'Other';

      if (!brands[brandName]) {
        brands[brandName] = {
          collections: {},
          other: [],
          displayOrder: item.brand?.DisplayOrder ?? Infinity // Store DisplayOrder directly
        };
      }

      if (collectionName === 'Other') {
        brands[brandName].other.push(item);
      } else {
        if (!brands[brandName].collections[collectionName]) {
          brands[brandName].collections[collectionName] = [];
        }
        brands[brandName].collections[collectionName].push(item);
      }
    });

    // Post-processing: Sort collections and items within brands
    for (const brandName in brands) {
      // Sort collections by DisplayOrder and then by name
      const sortedCollectionsArray = Object.entries(brands[brandName].collections).sort(([nameA, itemsA], [nameB, itemsB]) => {
        const collectionA = itemsA[0]?.collection;
        const collectionB = itemsB[0]?.collection;

        const orderA = collectionA?.DisplayOrder ?? Infinity;
        const orderB = collectionB?.DisplayOrder ?? Infinity;

        if (orderA === orderB) {
          return nameA.localeCompare(nameB); // Fallback to collection name
        }
        return orderA - orderB;
      });

      const sortedCollections = {};
      sortedCollectionsArray.forEach(([name, items]) => {
        // Sort items within each collection by collectionProductOrder
        sortedCollections[name] = items.sort((a, b) => {
          const orderA = a.collectionProductOrder ?? Infinity;
          const orderB = b.collectionProductOrder ?? Infinity;
          if (orderA === orderB) {
            return a.name.localeCompare(b.name); // Fallback to product name
          }
          return orderA - orderB;
        });
      });
      brands[brandName].collections = sortedCollections;

      // Sort 'other' items by product name
      brands[brandName].other.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Sort brands by DisplayOrder
    const sortedBrandEntries = Object.entries(brands).sort(([nameA, dataA], [nameB, dataB]) => {
      // If 'Unbranded' exists, ensure it's last
      if (nameA === 'Unbranded') return 1;
      if (nameB === 'Unbranded') return -1;

      const brandAOrder = dataA.displayOrder ?? Infinity;
      const brandBOrder = dataB.displayOrder ?? Infinity;

      if (brandAOrder === brandBOrder) {
        return nameA.localeCompare(nameB); // Fallback to brand name if DisplayOrder is the same
      }
      return brandAOrder - brandBOrder;
    });

    return Object.fromEntries(sortedBrandEntries);
  }, [shipmentIntakeList]);

  return (
    <div className="shipment-intake-container container mt-3">
      <h2 className="mb-3">Shipment Intake for Group Order {groupOrderId}</h2>
      {/* {message && <div className="alert alert-danger">{message}</div>} Removed as per user request */}
      {loading && <p>Loading...</p>}

      {Object.keys(groupedItems).length > 0 ? (
        Object.entries(groupedItems).map(([brandName, brandData]) => (
          <div key={brandName} className="mb-5">
            <h3 className="mt-4">{brandName}</h3>

            {Object.entries(brandData.collections).map(([collectionName, items]) => (
              <div key={collectionName} className="mb-4">
                <h4 className="mt-3">{collectionName}</h4>
                <div className="shipment-intake-product-list">
                  {items.map((item) => (
                    <div key={item.productId} className="shipment-intake-product-item card mb-2">
                      <div className="card-body">
                        <h5 className="card-title">{item.name}</h5>
                        <p className="card-text">Ordered Quantity: {item.quantity}</p>
                        <div className="d-flex justify-content-end">
                          {adjustingProductId === item.productId ? (
                            <>
                              <input
                                type="number"
                                className="form-control shipment-intake-input d-inline-block w-auto me-2"
                                value={adjustedQuantity}
                                onChange={handleAdjustQuantityChange}
                              />
                              <button
                                className="btn btn-primary btn-sm me-2"
                                onClick={() => handleSubmitAdjustedQuantity(item.productId)}
                              >
                                Submit
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setAdjustingProductId(null)}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="btn btn-success btn-sm me-2"
                                onClick={() => handleApprove(item.productId, item.quantity)}
                              >
                                Approve
                              </button>
                              <button
                                className="btn btn-warning btn-sm"
                                onClick={() => handleAdjustClick(item.productId, item.quantity)}
                              >
                                Adjust
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {brandData.other.length > 0 && (
              <div className="mb-4">
                <h4 className="mt-3">Other Items (No Collection)</h4>
                <div className="shipment-intake-product-list">
                  {brandData.other.map((item) => (
                    <div key={item.productId} className="shipment-intake-product-item card mb-2">
                      <div className="card-body">
                        <h5 className="card-title">{item.name}</h5>
                        <p className="card-text">Ordered Quantity: {item.quantity}</p>
                        <div className="d-flex justify-content-end">
                          {adjustingProductId === item.productId ? (
                            <>
                              <input
                                type="number"
                                className="form-control shipment-intake-input d-inline-block w-auto me-2"
                                value={adjustedQuantity}
                                onChange={handleAdjustQuantityChange}
                              />
                              <button
                                className="btn btn-primary btn-sm me-2"
                                onClick={() => handleSubmitAdjustedQuantity(item.productId)}
                              >
                                Submit
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setAdjustingProductId(null)}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="btn btn-success btn-sm me-2"
                                onClick={() => handleApprove(item.productId, item.quantity)}
                              >
                                Approve
                              </button>
                              <button
                                className="btn btn-warning btn-sm"
                                onClick={() => handleAdjustClick(item.productId, item.quantity)}
                              >
                                Adjust
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))
      ) : (
        !loading && <p>No shipment intake items found for this group order.</p>
      )}
    </div>
  );
};

export default ShipmentIntake;
