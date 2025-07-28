import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; // Add useNavigate
import ProductService from '../services/product.service';
import WebviewService from '../services/webview.service';
import './Cart.component.css';
import _ from 'lodash';

// Helper to parse query params
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const Cart = () => {
  const query = useQuery();
  const psid = query.get('psid');
  const navigate = useNavigate(); // Initialize useNavigate

  const [cart, setCart] = useState({});
  const handleBackToProducts = () => {
    navigate(`/messenger-order?psid=${psid}`);
  };
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUpdatingCart, setIsUpdatingCart] = useState(false);
  // messengerSdkLoaded is no longer directly used for button disabled state,
  // but keeping it for potential future Messenger Extensions features if needed.
  const [messengerSdkLoaded, setMessengerSdkLoaded] = useState(false);

  // Debounce cart updates to the backend
  const debouncedUpdateCart = useCallback(
    _.debounce((psid, items) => {
      setIsUpdatingCart(true);
      WebviewService.updateCart(psid, { items })
        .then(() => {
          console.log("Cart updated in backend from Cart component.");
          setIsUpdatingCart(false);
        })
        .catch(e => {
          console.error("Error debounced updating cart from Cart component:", e);
          setError(e.response?.data?.message || e.message || "Error updating cart.");
          setIsUpdatingCart(false);
        });
    }, 500), // Debounce for 500ms
    []
  );

  const fetchData = useCallback(() => {
    if (!psid) {
      setError("User ID (PSID) not found in URL.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');

    // Fetch products and current cart data
    Promise.all([
      ProductService.getAll({ psid: psid }),
      WebviewService.getOrderData(psid, {})
    ])
      .then(([productsResponse, orderDataResponse]) => {
        setProducts(productsResponse.data);
        const initialCart = {};
        // itemData is already the quantity due to backend normalization
        Object.entries(orderDataResponse.data.currentCart || {}).forEach(([productId, itemData]) => {
          initialCart[productId] = itemData;
        });
        setCart(initialCart);
        setLoading(false);
      })
      .catch(e => {
        setError(e.response?.data?.message || e.message || "Error fetching cart data.");
        console.error(e);
        setLoading(false);
      });
  }, [psid]);

  useEffect(() => {
    fetchData();

    // Initialize Messenger Extensions SDK
    window.extAsyncInit = function() {
      setMessengerSdkLoaded(true);
      console.log("Messenger Extensions SDK loaded and extAsyncInit fired.");
    };

    // If SDK is already loaded (e.g., hot reload), set state immediately
    if (window.MessengerExtensions) {
      setMessengerSdkLoaded(true);
      console.log("Messenger Extensions SDK already available on mount.");
    } else {
      console.log("Messenger Extensions SDK not yet available on mount. Waiting for extAsyncInit.");
    }
  }, [fetchData]);

  const getProduct = (productId) => {
    return products.find(product => product.id === parseInt(productId));
  };

  const handleQuantityChange = (productId, newQuantity) => {
    const quantity = parseInt(newQuantity, 10);
    setCart(prevCart => {
      let updatedCart;
      if (!isNaN(quantity) && quantity > 0) {
        updatedCart = { ...prevCart, [productId]: quantity };
      } else {
        // eslint-disable-next-line no-unused-vars
        const { [productId]: removed, ...restOfCart } = prevCart;
        updatedCart = restOfCart;
      }
      debouncedUpdateCart(psid, updatedCart);
      return updatedCart;
    });
  };

  const handleRemoveFromCart = (productId) => {
    setCart(prevCart => {
      // eslint-disable-next-line no-unused-vars
      const { [productId]: removed, ...updatedCart } = prevCart;
      debouncedUpdateCart(psid, updatedCart);
      return updatedCart;
    });
  };

  const calculateCartTotal = () => {
    let total = 0;
    Object.entries(cart).forEach(([productId, quantity]) => {
      const product = products.find(p => p.id === parseInt(productId));
      if (product) {
        total += parseFloat(product.price) * parseInt(quantity); // Ensure quantity is parsed as int
      }
    });
    return total.toFixed(2);
  };

  const handleSubmitOrderAndClose = async () => {
    console.log("handleSubmitOrderAndClose called.");
    setError(''); // Clear previous errors
    setIsUpdatingCart(true); // Indicate that an action is in progress

    try {
      // Call the new backend endpoint to finalize the order
      await WebviewService.finalizeOrder(psid); // Assuming psid is available and correct
      console.log("Order finalized in backend. Navigating to close notification.");
      navigate(`/close-notification?psid=${psid}`);
    } catch (e) {
      console.error("Error finalizing order from Cart component:", e);
      setError(e.response?.data?.message || e.message || "Error submitting order. Please try again.");
    } finally {
      setIsUpdatingCart(false);
    }
  };

  return (
    <div className="container cart-container">
      <button className="btn btn-back" onClick={handleBackToProducts}>← Back to Products</button>
      <h2>Cart</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? (
        <p>Loading cart...</p>
      ) : Object.keys(cart).length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div>
          {Object.entries(cart).map(([productId, quantity]) => {
            const product = getProduct(productId);
            // Ensure product exists and quantity is valid before rendering
            if (!product || quantity <= 0) return null;

            return (
              <div key={productId} className="product-container">
                {product.images && product.images.length > 0 && (
                  <img
                    src={product.images[0]} // Use the first image from the 'images' array
                    alt={product.name}
                    className="product-image"
                  />
                )}
                <div className="product-details-content">
                  <h4>{product.name}</h4>
                  <p>Price: ${parseFloat(product.price).toFixed(2)}</p>
                  <div className="quantity-controls">
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => handleQuantityChange(productId, quantity - 1)}
                      disabled={isUpdatingCart}
                    >
                      -
                    </button>
                    <span className="quantity">
                      {quantity}
                    </span>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => handleQuantityChange(productId, quantity + 1)}
                      disabled={isUpdatingCart}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="ms-auto"> {/* Use ms-auto for right alignment */}
                  <button className="btn btn-danger" onClick={() => handleRemoveFromCart(productId)} disabled={isUpdatingCart}>Remove</button>
                </div>
              </div>
            );
          })}
          {/* Subtotal */}
          <div className="order-total mt-3">
            Subtotal: ${calculateCartTotal()}
          </div>

          {/* Sticky Button Bar */}
          <div className="sticky-bottom-buttons d-flex justify-content-around p-3 bg-light border-top">
            <button
              className="btn btn-primary flex-grow-1"
              onClick={handleSubmitOrderAndClose}
              disabled={isUpdatingCart}
            >
              Submit Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
