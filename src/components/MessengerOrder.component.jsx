import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import WebviewService from '../services/webview.service';

// Helper to parse query params
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

// Function to load FB SDK
const loadFbSdk = () => {
  return new Promise((resolve) => {
    if (window.FB) {
      resolve();
      return;
    }
    window.fbAsyncInit = function() {
      // No need to init if only using MessengerExtensions
      console.log('FB SDK loaded');
      resolve();
    };
    (function(d, s, id){
       var js, fjs = d.getElementsByTagName(s)[0];
       if (d.getElementById(id)) {return;}
       js = d.createElement(s); js.id = id;
       js.src = "https://connect.facebook.net/en_US/sdk.js";
       fjs.parentNode.insertBefore(js, fjs);
     }(document, 'script', 'facebook-jssdk'));
  });
};


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
  const [sdkLoaded, setSdkLoaded] = useState(false);

  // Load FB SDK on mount
  useEffect(() => {
    loadFbSdk().then(() => setSdkLoaded(true));
  }, []);

  // Fetch initial data
  const fetchData = useCallback(() => {
    if (!psid) {
      setError("User ID (PSID) not found in URL.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    WebviewService.getOrderData(psid)
      .then(response => {
        setGroupOrderName(response.data.groupOrderName);
        setProducts(response.data.products);
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
      products.forEach(p => {
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
    if (!sdkLoaded) {
        setError("Cannot close window: Facebook SDK not loaded yet.");
        return;
    }

    setIsSaving(true);
    setError('');

    // Filter out zero quantities before sending
    const itemsToSave = {};
    Object.entries(cart).forEach(([productId, quantity]) => {
        if (quantity > 0) {
            itemsToSave[productId] = quantity;
        }
    });

    WebviewService.updateCart(psid, itemsToSave)
      .then(() => {
        console.log("Cart updated, closing webview...");
        // Close webview using Messenger Extensions SDK
        window.MessengerExtensions.requestCloseBrowser(function success() {
           console.log("Webview closed successfully");
        }, function error(err) {
           console.error("Error closing webview:", err);
           // Show error to user if closing fails?
           setError("Could not close window automatically. Please close it manually.");
           setIsSaving(false); // Allow retry?
        });
        // Note: The success/error callbacks might not fire reliably in all environments.
        // The window might close before the backend response is fully processed sometimes.
      })
      .catch(e => {
        setError(e.response?.data?.message || e.message || "Error saving cart.");
        console.error(e);
        setIsSaving(false);
      });
  };

  if (loading) return <div className="container mt-3"><p>Loading order details...</p></div>;
  if (error && !products.length) return <div className="container mt-3"><div className="alert alert-danger">{error}</div></div>; // Show only error if loading failed completely

  return (
    <div className="container mt-3 mb-5">
      <h3>{groupOrderName || 'Order Items'}</h3>
      <p>Adjust quantities below. Set quantity to 0 to remove an item.</p>
      {error && <div className="alert alert-danger">{error}</div>}

      <table className="table table-sm">
        <thead>
          <tr>
            <th>Item</th>
            <th>Price</th>
            <th style={{width: '100px'}}>Quantity</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id}>
              <td>
                {product.name}
                {product.image_url && <img src={product.image_url} alt={product.name} style={{maxWidth: '50px', marginLeft: '10px', verticalAlign: 'middle'}} />}
              </td>
              <td>${parseFloat(product.price).toFixed(2)}</td>
              <td>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  min="0"
                  value={cart[product.id] || 0}
                  onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                  style={{ width: '80px', textAlign: 'center' }}
                />
              </td>
               <td>${(parseFloat(product.price) * (cart[product.id] || 0)).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
         <tfoot>
            <tr>
                <th colSpan="3" style={{textAlign: 'right'}}>Estimated Item Total:</th>
                <th>${calculateTotal()}</th>
            </tr>
        </tfoot>
      </table>

      <div className="mt-3 d-grid">
        <button
          className="btn btn-primary"
          onClick={handleSaveAndClose}
          disabled={isSaving || !sdkLoaded}
        >
          {isSaving ? 'Saving...' : 'Save Selections & Close'}
        </button>
         {!sdkLoaded && <small className="text-muted text-center mt-1">Waiting for Facebook SDK...</small>}
      </div>
    </div>
  );
};

export default MessengerOrder;
