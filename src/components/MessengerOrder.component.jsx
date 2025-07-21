import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
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
    }, 300),
    []
  );

  // Debounce cart updates to the backend
  const debouncedUpdateCart = useCallback(
    _.debounce((psid, items) => {
      WebviewService.updateCart(psid, { items })
        .then(() => {
          console.log("Cart updated in backend.");
        })
        .catch(e => {
          console.error("Error debounced updating cart:", e);
          // Optionally, set an error state here if needed for user feedback
        });
    }, 500), // Debounce for 500ms
    []
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
        // itemData is already the quantity due to backend normalization
        Object.entries(response.data.currentCart || {}).forEach(([productId, itemData]) => {
          initialCart[productId] = itemData;
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
  }, [fetchData]);

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
      // Call debounced update to backend
      debouncedUpdateCart(psid, updatedCart);
      return updatedCart;
    });
  };

  const calculateTotal = () => {
    let total = 0;
    // Use the actual products array to calculate total, not filteredProducts,
    // to ensure total reflects all items in cart, even if not currently visible due to search.
    Object.entries(cart).forEach(([productId, quantity]) => {
      const product = products.find(p => p.id === parseInt(productId));
      if (product) {
        total += parseFloat(product.price) * parseInt(quantity); // Ensure quantity is parsed as int
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
        // Navigate to the cart page within the webview
        navigate(`/cart?psid=${psid}`);
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
      <div className="sticky-top search-bar-container">
        <input
          type="text"
          className="form-control"
          placeholder="Search by name or collection"
          onChange={handleSearchChange}
        />
      </div>

            <p className="text-muted mt-3">Tap on an item for more details or adjust quantities below. Set quantity to 0 to remove an item.</p>
            {error && <div className="alert alert-danger">{error}</div>}

            {sortedCollections.map(collection => (
                <div key={collection} className="mb-4">
                    <h4>{collection}</h4>
                    {groupedProducts[collection].length === 0 && searchTerm ? (
                        <p className="text-muted">No products found in this collection matching your search.</p>
                    ) : (
                        groupedProducts[collection].map(product => (
                            <div key={product.id} className="product-container">
                                <Link to={`/product-detail/${product.id}?psid=${psid}`} className="product-image-link">
                                    {product.images && product.images.length > 0 && (
                                        <img src={`${import.meta.env.VITE_BACKEND_URL}${product.images[0]}`} alt={product.name} className="product-image" />
                                    )}
                                </Link>
                                <div className="product-details-content">
                                    <Link to={`/product-detail/${product.id}?psid=${psid}`} className="product-name-link">
                                        <ul className="product-details">
                                            <li>{product.name}</li>
                                            <li>Price: ${parseFloat(product.price).toFixed(2)}</li>
                                        </ul>
                                    </Link>
                                    <div className="quantity-section-inline"> {/* New div for quantity controls */}
                                        <label>Quantity:</label>
                                        <div className="quantity-controls">
                                            <button
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={() => handleQuantityChange(product.id, (cart[product.id] || 0) - 1)}
                                                disabled={isSaving}
                                            >
                                                -
                                            </button>
                                            <span className="quantity">
                                                {cart[product.id] || 0}
                                            </span>
                                            <button
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={() => handleQuantityChange(product.id, (cart[product.id] || 0) + 1)}
                                                disabled={isSaving}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ))}

      {filteredProducts.length === 0 && !loading && !error && (
        <p className="text-muted text-center">No products available or matching your search.</p>
      )}

      <div className="mt-3 d-grid gap-2 sticky-bottom">
        <div className="order-total">
          Subtotal: ${calculateTotal()}
        </div>
        <button
          className="btn btn-primary"
          onClick={handleSaveAndClose}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Continue to Cart'}
        </button>
      </div>
    </div>
  );
};

export default MessengerOrder;
