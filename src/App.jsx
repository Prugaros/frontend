import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import AuthService from './services/auth.service';
import Login from './components/Login.component.jsx';
// Import actual components
import ProductList from './components/ProductList.component.jsx';
import ProductForm from './components/ProductForm.component.jsx';
import GroupOrderList from './components/GroupOrderList.component.jsx';
import GroupOrderForm from './components/GroupOrderForm.component.jsx';
import OrderList from './components/OrderList.component.jsx';
import OrderDetail from './components/OrderDetail.component.jsx';
import MessengerOrder from './components/MessengerOrder.component.jsx'; // Import MessengerOrder

// Placeholder components
const Dashboard = () => <h2>Admin Dashboard</h2>;


import './App.css';
// import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
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

  // Basic protected route wrapper
  const ProtectedRoute = ({ children }) => {
    if (!currentUser) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };


  return (
    <Router>
      <div>
        {/* Hide Nav for the messenger webview route? Or adjust layout */}
        {/* We might need a way to detect if it's in the webview */}
        <nav className="navbar navbar-expand navbar-dark bg-dark">
          <Link to={"/"} className="navbar-brand">
            SCG Bot Admin
          </Link>
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
        </nav>

        <div className="container mt-3">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            {/* Messenger Webview Route (Public) */}
            <Route path="/messenger-order" element={<MessengerOrder />} />


            {/* Protected Routes */}
            <Route path="/" element={ <ProtectedRoute> <Dashboard /> </ProtectedRoute> } />
            <Route path="/dashboard" element={ <ProtectedRoute> <Dashboard /> </ProtectedRoute> } />
            {/* Product Routes */}
            <Route path="/products" element={ <ProtectedRoute> <ProductList /> </ProtectedRoute> } />
            <Route path="/products/new" element={ <ProtectedRoute> <ProductForm /> </ProtectedRoute> } />
            <Route path="/products/edit/:id" element={ <ProtectedRoute> <ProductForm /> </ProtectedRoute> } />
            {/* Group Order Routes */}
            <Route path="/group-orders" element={ <ProtectedRoute> <GroupOrderList /> </ProtectedRoute> } />
            <Route path="/group-orders/new" element={ <ProtectedRoute> <GroupOrderForm /> </ProtectedRoute> } />
            <Route path="/group-orders/edit/:id" element={ <ProtectedRoute> <GroupOrderForm /> </ProtectedRoute> } />
            {/* Order Routes */}
            <Route path="/orders" element={ <ProtectedRoute> <OrderList /> </ProtectedRoute> } />
            <Route path="/orders/:id" element={ <ProtectedRoute> <OrderDetail /> </ProtectedRoute> } />

             {/* Redirect unknown protected paths to dashboard, others to login */}
             <Route path="*" element={currentUser ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />

          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
