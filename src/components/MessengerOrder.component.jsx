import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import WebviewService from '../services/webview.service';
import './MessengerOrder.component.css';
import _ from 'lodash';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const BrandSelectionModal = ({ isOpen, onClose, brands, setActiveTab }) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleBrandClick = (brandId) => {
    setActiveTab(brandId);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <h2>Select a Brand</h2>
        <button onClick={() => handleBrandClick('featured')}>Featured</button>
        {brands.map(brand => (
          <button key={brand.id} onClick={() => handleBrandClick(brand.id)}>
            {brand.name}
          </button>
        ))}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

const MessengerOrder = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const psid = query.get('psid');

  const [groupOrderName, setGroupOrderName] = useState('');
  const [brands, setBrands] = useState([]);
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('activeTab') || 'featured');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [featuredData, setFeaturedData] = useState({ featuredCollections: [], otherFeaturedItems: [] });
  const [brandDataCache, setBrandDataCache] = useState({}); // Cache for brand data
  const [loadingTab, setLoadingTab] = useState(false);

  // Restore scroll position after loading and tab content is ready
  useEffect(() => {
    if (!loading && !loadingTab) {
      const scrollPosition = sessionStorage.getItem('messengerOrderScrollPosition');
      if (scrollPosition) {
        // Use a timeout to ensure the content is rendered before scrolling
        setTimeout(() => {
          window.scrollTo(0, parseInt(scrollPosition, 10));
          sessionStorage.removeItem('messengerOrderScrollPosition');
          sessionStorage.removeItem('activeTab'); // Clean up after use
        }, 100); 
      }
    }
  }, [loading, loadingTab]);

  const debouncedUpdateCart = useCallback(
    _.debounce((psid, items) => {
      WebviewService.updateCart(psid, { items }).catch(e => console.error("Error debounced updating cart:", e));
    }, 500),
    []
  );

  // Initial data fetch
  useEffect(() => {
    if (!psid) {
      setError("User ID (PSID) not found in URL.");
      setLoading(false);
      return;
    }
    setLoading(true);
    WebviewService.getOrderData(psid)
      .then(response => {
        setGroupOrderName(response.data.groupOrderName);
        setBrands(response.data.brands || []);
        const initialCart = {};
        Object.entries(response.data.currentCart || {}).forEach(([productId, quantity]) => {
          initialCart[productId] = quantity;
        });
        setCart(initialCart);
        // Now fetch featured data
        return WebviewService.getFeaturedData();
      })
      .then(response => {
        setFeaturedData({
            featuredCollections: response.data.featuredCollections || [],
            otherFeaturedItems: response.data.otherFeaturedItems || []
        });
        setLoading(false);
      })
      .catch(e => {
        setError(e.response?.data?.message || e.message || "Error fetching data.");
        setLoading(false);
      });
  }, [psid]);

  // Fetch data for brand when tab is clicked
  useEffect(() => {
    if (activeTab !== 'featured' && !brandDataCache[activeTab]) {
      setLoadingTab(true);
      WebviewService.getBrandData(activeTab)
        .then(response => {
          setBrandDataCache(prevCache => ({
            ...prevCache,
            [activeTab]: response.data
          }));
          setLoadingTab(false);
        })
        .catch(e => {
          setError(`Error fetching data for brand ${activeTab}.`);
          setLoadingTab(false);
        });
    }
  }, [activeTab, brandDataCache]);


  const handleQuantityChange = (productId, newQuantity) => {
    const quantity = Math.max(0, parseInt(newQuantity));
    setCart(prevCart => {
      const updatedCart = { ...prevCart };
      if (quantity > 0) {
        updatedCart[productId] = quantity;
      } else {
        delete updatedCart[productId];
      }
      debouncedUpdateCart(psid, updatedCart);
      return updatedCart;
    });
  };

  const allProductsForCart = useMemo(() => {
    const brandCollections = Object.values(brandDataCache).flatMap(brand => brand.collections || []);
    const otherBrandItems = Object.values(brandDataCache).flatMap(brand => brand.otherBrandItems || []);
    
    const allCollections = [
        ...(featuredData.featuredCollections || []),
        ...brandCollections
    ];
    
    const allItems = [
        ...(featuredData.otherFeaturedItems || []),
        ...otherBrandItems,
        ...allCollections.flatMap(c => c.products || [])
    ];
    
    return _.uniqBy(allItems, 'id');
}, [featuredData, brandDataCache]);

  const calculateTotal = () => {
    return Object.entries(cart).reduce((total, [productId, quantity]) => {
      const product = allProductsForCart.find(p => p.id === parseInt(productId));
      return total + (product ? parseFloat(product.price) * quantity : 0);
    }, 0).toFixed(2);
  };

  const cartItemCount = useMemo(() => {
    return Object.values(cart).reduce((count, quantity) => count + quantity, 0);
  }, [cart]);

  const handleSaveAndClose = () => {
    setIsSaving(true);
    WebviewService.updateCart(psid, { items: cart })
      .then(() => {
        // Clear session storage on explicit navigation to cart
        sessionStorage.removeItem('messengerOrderScrollPosition');
        sessionStorage.removeItem('activeTab');
        navigate(`/cart?psid=${psid}`);
      })
      .catch(e => {
        setError(e.response?.data?.message || e.message || "Error saving cart.");
        setIsSaving(false);
      });
  };

  const handleProductLinkClick = () => {
    sessionStorage.setItem('messengerOrderScrollPosition', window.scrollY);
    sessionStorage.setItem('activeTab', activeTab);
  };

  const renderCollections = (collections) => {
    if (!collections || collections.length === 0) {
        return <p className="text-muted">No items found for this brand.</p>;
    }

    const filteredCollections = collections
        .map(collection => ({
            ...collection,
            products: (collection.products || []).filter(p => !p.is_blacklisted && p.name.toLowerCase().includes(searchTerm.toLowerCase()))
        }))
        .filter(collection => collection.products.length > 0);

    if (filteredCollections.length === 0) {
        return <p className="text-muted">No products found matching your search.</p>;
    }

    return filteredCollections.map(collection => (
        <div key={collection.id} className="mb-4">
            <h4>{collection.name || collection.Name}</h4>
            <div className="product-grid">
                {collection.products.map(product => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    ));
  };
  
  const ProductCard = ({ product }) => (
    <div key={product.id} className="product-container">
      <Link to={`/product-detail/${product.id}?psid=${psid}`} className="product-image-link" onClick={handleProductLinkClick}>
        {product.images && product.images.length > 0 && (
          <img src={`${import.meta.env.VITE_BACKEND_URL}${product.images[0]}`} alt={product.name} className="product-image" />
        )}
      </Link>
      <div className="product-details-content">
        <Link to={`/product-detail/${product.id}?psid=${psid}`} className="product-name-link" onClick={handleProductLinkClick}>
          <ul className="product-details">
            <li>{product.name}</li>
            <li>Price: ${parseFloat(product.price).toFixed(2)}</li>
          </ul>
        </Link>
        <div className="quantity-section-inline">
          <label>Quantity:</label>
          <div className="quantity-controls">
            <button className="btn btn-sm btn-outline-secondary" onClick={() => handleQuantityChange(product.id, (cart[product.id] || 0) - 1)} disabled={isSaving}>-</button>
            <span className="quantity">{cart[product.id] || 0}</span>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => handleQuantityChange(product.id, (cart[product.id] || 0) + 1)} disabled={isSaving}>+</button>
          </div>
        </div>
      </div>
    </div>
  );

  const activeBrandName = activeTab === 'featured' 
    ? 'Featured' 
    : brands.find(b => b.id === activeTab)?.name || 'Select a Brand';

  if (loading) return <div className="container mt-3"><p>Loading order details...</p></div>;
  if (error) return <div className="container mt-3"><div className="alert alert-danger">{error}</div></div>;

  return (
    <div className="container">
      <BrandSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        brands={brands}
        setActiveTab={setActiveTab}
      />
      <h3>{groupOrderName || 'Order Items'}</h3>

      <div className="sticky-top">
        <div className="controls-container">
          <div className="dropdown-container">
            <button onClick={() => setIsModalOpen(true)} className="dropdown-button">
              {activeBrandName} <i className="fas fa-chevron-down"></i>
            </button>
          </div>
          <div className="search-bar-container">
            <input
              type="text"
              className="form-control"
              placeholder="Search by name..."
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Link to={`/cart?psid=${psid}`} className="cart-icon-link">
            <i className="fas fa-shopping-cart"></i>
            {cartItemCount > 0 && <span className="cart-item-count">{cartItemCount}</span>}
          </Link>
        </div>
      </div>
      <div>
        <p className="text-muted mt-3">Tap on an item for more details or adjust quantities below. Set quantity to 0 to remove an item.</p>
        {error && <div className="alert alert-danger">{error}</div>}

        <div className="tab-content mt-3">
          {activeTab === 'featured' ? (
            <div>
            {renderCollections(featuredData.featuredCollections)}
            {featuredData.otherFeaturedItems.length > 0 && (
              <>
                <h4>Other Featured Items</h4>
                <div className="product-grid">
                    {featuredData.otherFeaturedItems.filter(p => !p.is_blacklisted && p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
              </>
            )}
          </div>
        ) : (
          loadingTab ? <p>Loading brand items...</p> : (
            <div>
              {renderCollections(brandDataCache[activeTab]?.collections || [])}
              {brandDataCache[activeTab]?.otherBrandItems?.length > 0 && (
                <>
                  <h4>Other {brandDataCache[activeTab]?.name} Items</h4>
                    <div className="product-grid">
                        {brandDataCache[activeTab].otherBrandItems
                        .filter(p => !p.is_blacklisted && p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </>
              )}
            </div>
          )
        )}
        </div>
      </div>
    </div>
  );
};

export default MessengerOrder;
