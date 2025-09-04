import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import Cart from './components/Cart.component.jsx';
import ShipmentIntake from './components/ShipmentIntake.jsx';
import AuthService from './services/auth.service';
import Login from './components/Login.component.jsx';
import ProductListTable from './components/ProductListTable.component.jsx';
import ProductForm from './components/ProductForm.component.jsx';
import CollectionList from './components/CollectionList.component.jsx';
import CollectionForm from './components/CollectionForm.component.jsx';
import BrandList from './components/BrandList.component.jsx';
import BrandForm from './components/BrandForm.component.jsx';
import GroupOrderList from './components/GroupOrderList.component.jsx';
import GroupOrderForm from './components/GroupOrderForm.component.jsx';
import OrderList from './components/OrderList.component.jsx';
import OrderDetail from './components/OrderDetail.component.jsx';
import MessengerOrder from './components/MessengerOrder.component.jsx';
import ProductDetail from './components/ProductDetail.component.jsx'; // Import the new component
import AddressForm from './components/AddressForm.component.jsx';
import CloseNotification from './components/CloseNotification.component.jsx'; // Import the new component
import Payment from './components/Payment.component.jsx';
import OrderSubmitted from './components/OrderSubmitted.component.jsx';
import PurchaseList from './components/PurchaseList.component.jsx';
import GroupOrderPurchaseList from './components/GroupOrderPurchaseList.component.jsx';
import PurchaseOrderList from './components/PurchaseOrderList.component.jsx';
import InStockProducts from './components/InStockProducts.jsx';
import ShipmentManifest from './components/ShipmentManifest.component.jsx';
import PackingOrders from './components/PackingOrders.component.jsx';
import PrivacyPolicy from './components/PrivacyPolicy.component.jsx';
import StoreCredit from './components/StoreCredit.component.jsx';

// Placeholder components
const Dashboard = () => <h2>Admin Dashboard</h2>;


import './App.css';
// import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const location = useLocation(); // Call useLocation unconditionally as the very first hook
  const [currentUser, setCurrentUser] = useState(undefined);

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const logOut = () => {
    AuthService.logout();
    setCurrentUser(undefined);
  };

  const handleLoginSuccess = () => {
    setCurrentUser(AuthService.getCurrentUser());
  };

  // Basic protected route wrapper
  const ProtectedRoute = ({ children }) => {
    if (!currentUser) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  const isWebview = location.pathname === '/messenger-order' ||
                    location.pathname === '/cart' ||
                    location.pathname.startsWith('/product-detail/') ||
                    location.pathname === '/close-notification' ||
                    location.pathname === '/address' ||
                    location.pathname === '/payment' ||
                    location.pathname === '/order-submitted';

  const containerClass = isWebview ? '' : 'container mt-3';

  return (
    <div>
      {/* Hide Nav for the messenger webview route? Or adjust layout */}
      {/* We might need a way to detect if it's in the webview */}
      {!isWebview ? (
        <>
          <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
            <Link to={"/"} className="navbar-brand">
              SCG Bot Admin
            </Link>
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarNav"
              aria-controls="navbarNav"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
              <div className="navbar-nav mr-auto">
                {currentUser && (
                  <>
                    <li className="nav-item">
                      <Link to={"/dashboard"} className="nav-link">
                        Dashboard
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link to={"/products"} className="nav-link">
                        Products
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link to={"/group-orders"} className="nav-link">
                        Group Orders
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link to={"/orders"} className="nav-link">
                        Orders
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link to={"/collections"} className="nav-link">
                        Collections
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link to={"/brands"} className="nav-link">
                        Brands
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link to={"/in-stock"} className="nav-link">
                        In Stock
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link to={"/store-credit"} className="nav-link">
                        Store Credit
                      </Link>
                    </li>
                  </>
                )}
              </div>

              {currentUser ? (
                <div className="navbar-nav ms-auto">
                  <li className="nav-item">
                    <span className="nav-link">
                      {currentUser.username}
                    </span>
                  </li>
                  <li className="nav-item">
                    <a href="/login" className="nav-link" onClick={logOut}>
                      LogOut
                    </a>
                  </li>
                </div>
              ) : (
                <div className="navbar-nav ms-auto">
                  <li className="nav-item">
                    <Link to={"/login"} className="nav-link">
                      Login
                    </Link>
                  </li>
                </div>
              )}
            </div>
          </nav>
        </>
      ) : null}

      <div className={containerClass}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          {/* Messenger Webview Routes (Public) */}
          <Route path="/messenger-order" element={<MessengerOrder />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/address" element={<AddressForm />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/order-submitted" element={<OrderSubmitted />} />
          <Route path="/product-detail/:productId" element={<ProductDetail />} /> {/* New Product Detail Route */}
          <Route path="/close-notification" element={<CloseNotification />} /> {/* New Close Notification Route */}

          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute> <Dashboard /> </ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute> <Dashboard /> </ProtectedRoute>} />
          {/* Product Routes */}
          <Route path="/products" element={<ProtectedRoute> <ProductListTable /> </ProtectedRoute>} />
          <Route path="/products/new" element={<ProtectedRoute> <ProductForm /> </ProtectedRoute>} />
          <Route path="/products/edit/:id" element={<ProtectedRoute> <ProductForm /> </ProtectedRoute>} />
          {/* Collection Routes */}
          <Route path="/collections" element={<ProtectedRoute> <CollectionList /> </ProtectedRoute>} />
          <Route path="/collections/new" element={<ProtectedRoute><CollectionForm /></ProtectedRoute>} />
          <Route path="/collections/edit/:id" element={<ProtectedRoute><CollectionForm /></ProtectedRoute>} />
          {/* Brand Routes */}
          <Route path="/brands" element={<ProtectedRoute> <BrandList /> </ProtectedRoute>} />
          <Route path="/brands/new" element={<ProtectedRoute><BrandForm /></ProtectedRoute>} />
          <Route path="/brands/edit/:id" element={<ProtectedRoute><BrandForm /></ProtectedRoute>} />
          {/* Group Order Routes */}
          <Route path="/group-orders" element={<ProtectedRoute> <GroupOrderList /> </ProtectedRoute>} />
          <Route path="/group-orders/new" element={<ProtectedRoute> <GroupOrderForm /> </ProtectedRoute>} />
          <Route path="/group-orders/edit/:id" element={<ProtectedRoute> <GroupOrderForm /> </ProtectedRoute>} />
          {/* Order Routes */}
          <Route path="/orders" element={<ProtectedRoute> <OrderList /> </ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute> <OrderDetail /> </ProtectedRoute>} />
          {/* Purchase List Route */}
          <Route path="/purchase-list" element={<ProtectedRoute><PurchaseList /></ProtectedRoute>} />
          <Route path="/purchase-list/:groupOrderId" element={<ProtectedRoute><GroupOrderPurchaseList /></ProtectedRoute>} />
          <Route path="/purchase-orders/:groupOrderId" element={<ProtectedRoute><PurchaseOrderList /></ProtectedRoute>} />
          <Route path="/in-stock" element={<ProtectedRoute><InStockProducts /></ProtectedRoute>} />
          <Route path="/shipment-intake/:groupOrderId" element={<ProtectedRoute><ShipmentIntake /></ProtectedRoute>} />
          <Route path="/packing-orders/:group_order_id" element={<ProtectedRoute><PackingOrders /></ProtectedRoute>} />
          <Route path="/shipment-manifest/:group_order_id" element={<ProtectedRoute><ShipmentManifest /></ProtectedRoute>} />
          <Route path="/store-credit" element={<ProtectedRoute><StoreCredit /></ProtectedRoute>} />

          {/* Redirect unknown protected paths to dashboard, others to login */}
          <Route path="*" element={currentUser ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
