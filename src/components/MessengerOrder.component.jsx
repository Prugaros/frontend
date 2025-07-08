import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import WebviewService from '../services/webview.service';
import './MessengerOrder.component.css';
import _ from 'lodash';

// Helper to parse query params
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const MessengerOrder = () => {
  const query = useQuery();
  const navigate = useNavigate(); // Although we won't navigate within React Router
  const psid = query.get('psid');

  const [groupOrderName, setGroupOrderName] = useState('');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({}); // Format: { productId: quantity }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);

  // Debounce search term changes
  const debouncedSetSearchTerm = useCallback(
    _.debounce(value => {
      setSearchTerm(value);
    }, 300), []
  );

  // Fetch initial data
  const fetchData = useCallback(() => {
    if (!psid) {
      setError("User ID (PSID) not found in URL.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');

    WebviewService.getOrderData(psid, {})
      .then(response => {
        setGroupOrderName(response.data.groupOrderName);
        setProducts(response.data.products);
        setFilteredProducts(response.data.products); // Initialize filtered products
        // Initialize cart state from backend data
        const initialCart = {};
        Object.entries(response.data.currentCart || {}).forEach(([productId, itemData]) => {
          initialCart[productId] = itemData.quantity;
        });
        setCart(initialCart);
        setLoading(false);
      })
      .catch(e => {
        setError(e.response?.data?.message || e.message || "Error fetching order data.");
        console.error(e);
        setLoading(false);
      });
  }, [psid]);

  useEffect(() => {
    fetchData();
  }, [fetchData]); // Fetch data when component mounts or psid changes

  useEffect(() => {
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.collection && product.collection.Name && product.collection.Name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const handleQuantityChange = (productId, newQuantity) => {
    const quantity = parseInt(newQuantity);
    setCart(prevCart => {
      const updatedCart = { ...prevCart };
      if (!isNaN(quantity) && quantity > 0) {
        updatedCart[productId] = quantity;
      } else {
        // Remove item if quantity is 0 or invalid
        delete updatedCart[productId];
      }
      return updatedCart;
    });
  };

  const calculateTotal = () => {
    let total = 0;
    filteredProducts.forEach(p => {
      if (cart[p.id]) {
        total += parseFloat(p.price) * cart[p.id];
      }
    });
    return total.toFixed(2);
  };

  const handleSaveAndClose = () => {
    if (!psid) {
      setError("Cannot save cart: User ID (PSID) is missing.");
      return;
    }

    setIsSaving(true);
    setError('');

    // Filter out zero quantities before sending
    const itemsToSave = {};
    Object.entries(cart).forEach(([productId, quantity]) => {
      if (quantity > 0) {
        itemsToSave[String(productId)] = quantity; // Convert productId to string
      }
    });

    WebviewService.updateCart(psid, { items: itemsToSave })
      .then(() => {
        console.log("Cart updated.");
        setIsSaving(false);
        setError("Your selections have been saved. Please close this window to return to Messenger.");

        if (window.MessengerExtensions) {
          window.MessengerExtensions.requestCloseBrowser(function success() {
            // webview closed
          }, function error(err) {
            console.error(err);
          });
        } else {
          console.log("Messenger Extensions not available.");
        }
      })
      .catch(e => {
        setError(e.response?.data?.message || e.message || "Error saving cart.");
        console.error(e);
        setIsSaving(false);
      });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Group products by Collection
  const groupedProducts = filteredProducts.reduce((groups, product) => {
    const collection = product.collection ? product.collection.Name : 'Uncategorized';
    if (!groups[collection]) {
      groups[collection] = [];
    }
    groups[collection].push(product);
    return groups;
  }, {});

  // Sort collections by DisplayOrder
  const sortedCollections = Object.keys(groupedProducts).sort((a, b) => {
    const collectionA = products.find(p => p.collection && p.collection.Name === a)?.collection;
    const collectionB = products.find(p => p.collection && p.collection.Name === b)?.collection;

    if (!collectionA && !collectionB) {
      return a.localeCompare(b); // Sort alphabetically if DisplayOrder is not available
    } else if (!collectionA) {
      return 1; // Move items without DisplayOrder to the end
    } else if (!collectionB) {
      return -1;
    } else {
      return (collectionA.DisplayOrder || 0) - (collectionB.DisplayOrder || 0); // Sort by DisplayOrder, default to 0 if null
    }
  });

  if (loading) return <div className="container mt-3"><p>Loading order details...</p></div>;
  if (error && !filteredProducts.length) return <div className="container mt-3"><div className="alert alert-danger">{error}</div></div>; // Show only error if loading failed completely

  return (
    <div className="container">
      <h3>{groupOrderName || 'Order Items'}</h3>

      {/* Search Bar */}
      <div className="mb-3 sticky-top">
        <input
          type="text"
          className="form-control"
          placeholder="Search by name"
          onChange={handleSearchChange}
          style={{ width: '200px' }}
        />
      </div>

      <p>Adjust quantities below. Set quantity to 0 to remove an item.</p>
      {error && <div className="alert alert-danger">{error}</div>}

      {sortedCollections.map(collection => (
        <div key={collection} className="mb-4">
          <h4>{collection}</h4>
          {groupedProducts[collection].map(product => (
            <div key={product.id} className="product-container">
              {product.image_url && <img src={product.image_url} alt={product.name} className="product-image" />}
              <ul className="product-details">
                <li>{product.name}</li>
                <li>Price: ${parseFloat(product.price).toFixed(2)}</li>
                <li>
                  Quantity:
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    min="0"
                    value={cart[product.id] || 0}
                    onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                    style={{ width: '80px', textAlign: 'center', display: 'inline-block', marginLeft: '10px' }}
                  />
                </li>
              </ul>
            </div>
          ))}
        </div>
      ))}

      <div className="mt-3 d-grid sticky-bottom">
        <button
          className="btn btn-primary"
          onClick={handleSaveAndClose}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Selections & Close'}
        </button>
        {error && <div className="alert alert-danger">{error}</div>}
      </div>
    </div>
  );
};

export default MessengerOrder;
