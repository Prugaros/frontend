import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import ProductService from '../services/product.service';
import WebviewService from '../services/webview.service';
import './ProductDetail.component.css';
import _ from 'lodash';

// Helper to parse query params
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ProductDetail = () => {
  const { productId } = useParams();
  const query = useQuery();
  const psid = query.get('psid');
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [cartItems, setCartItems] = useState({}); // New state to hold the entire cart
  const [isUpdatingCart, setIsUpdatingCart] = useState(false);
  const [mainImage, setMainImage] = useState('');

  const handleImageClick = (image) => {
    setMainImage(image);
  };

  // Debounce cart updates to the backend
  const debouncedUpdateCart = useCallback(
    _.debounce((psid, updatedCart) => { // updatedCart now contains the full cart
      setIsUpdatingCart(true);
      WebviewService.updateCart(psid, { items: updatedCart }) // Send the full updated cart
        .then(() => {
          console.log("Cart updated from ProductDetail component.");
          setIsUpdatingCart(false);
        })
        .catch(e => {
          console.error("Error debounced updating cart from ProductDetail component:", e);
          setError(e.response?.data?.message || e.message || "Error updating cart.");
          setIsUpdatingCart(false);
        });
    }, 500),
    []
  );

  useEffect(() => {
    if (!psid) {
      setError("User ID (PSID) not found in URL.");
      setLoading(false);
      return;
    }
    if (!productId) {
      setError("Product ID not found in URL.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    // Fetch product details and current cart data
    Promise.all([
      ProductService.getAll({ psid: psid }), // Fetch all products to find the specific one
      WebviewService.getOrderData(psid, {})
    ])
      .then(([productsResponse, orderDataResponse]) => {
        const foundProduct = productsResponse.data.find(p => p.id === parseInt(productId));
        if (foundProduct) {
          setProduct(foundProduct);
          // Set initial main image to the first image in the 'images' array
          setMainImage(foundProduct.images && foundProduct.images.length > 0 ? foundProduct.images[0] : '');
          const currentCartData = orderDataResponse.data.currentCart || {};
          const normalizedCart = {};
          // Normalize the cart data to { productId: quantity } format
          Object.entries(currentCartData).forEach(([id, item]) => {
            normalizedCart[id] = typeof item === 'object' ? item.quantity : item;
          });
          console.log("[ProductDetail] Received and normalized currentCart from backend:", normalizedCart);
          setCartItems(normalizedCart); // Initialize cartItems with the normalized cart
          setQuantity(normalizedCart[productId] ? normalizedCart[productId] : 0);
        } else {
          setError("Product not found.");
        }
        setLoading(false);
      })
      .catch(e => {
        setError(e.response?.data?.message || e.message || "Error fetching product details.");
        console.error(e);
        setLoading(false);
      });
  }, [psid, productId, debouncedUpdateCart]);

  const handleQuantityChange = (newQuantity) => {
    const parsedQuantity = parseInt(newQuantity);
    const updatedQuantity = !isNaN(parsedQuantity) && parsedQuantity >= 0 ? parsedQuantity : 0;
    setQuantity(updatedQuantity);

    // Create a new cart object based on the current cartItems state
    const newCartItems = { ...cartItems };
    if (updatedQuantity > 0) {
      newCartItems[productId] = updatedQuantity; // Store only quantity
    } else {
      delete newCartItems[productId];
    }
    setCartItems(newCartItems); // Update the local cart state

    debouncedUpdateCart(psid, newCartItems); // Send the full updated cart
  };

  const handleGoToCart = () => {
    navigate(`/cart?psid=${psid}`);
  };

  if (loading) return <div className="container mt-3"><p>Loading product details...</p></div>;
  if (error) return <div className="container mt-3"><div className="alert alert-danger">{error}</div></div>;
  if (!product) return <div className="container mt-3"><p>Product data not available.</p></div>;

  // Use the 'images' array directly, ensuring it's an array
  const allImages = product.images || [];

  return (
    <div className="container product-detail-container">
      <button className="btn btn-back" onClick={() => navigate(-1)}>← Back to Products</button>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="main-image-section">
        <img src={`${import.meta.env.VITE_BACKEND_URL}${mainImage}`} alt={product.name} className="main-product-image" />
      </div>

      <div className="thumbnail-gallery">
        {allImages.map((img, index) => (
          <img
            key={index}
            src={`${import.meta.env.VITE_BACKEND_URL}${img}`}
            alt={`${product.name} thumbnail ${index + 1}`}
            className={`thumbnail-image ${img === mainImage ? 'active' : ''}`}
            onClick={() => handleImageClick(img)}
          />
        ))}
      </div>

      <div className="product-info">
        <h2>{product.name}</h2>
        <p className="product-description">{product.description}</p>
        <p className="product-price">Price: ${parseFloat(product.price).toFixed(2)}</p>

        <div className="quantity-section">
          <label htmlFor="quantity-input">Quantity:</label>
          <div className="quantity-controls">
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={isUpdatingCart}
            >
              -
            </button>
            <span className="quantity">
              {quantity}
            </span>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={isUpdatingCart}
            >
              +
            </button>
          </div>
        </div>
      </div>
      <div className="action-buttons">
        <button
          className="btn btn-primary"
          onClick={handleGoToCart}
          disabled={isUpdatingCart}
        >
          Go to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductDetail;
