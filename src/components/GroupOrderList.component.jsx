import React, { useState, useEffect } from 'react';
import GroupOrderService from '../services/groupOrder.service';
import { Link } from 'react-router-dom';

const GroupOrderList = () => {
  const [groupOrders, setGroupOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(''); // For action messages

  useEffect(() => {
    retrieveGroupOrders();
  }, []);

  const retrieveGroupOrders = () => {
    setLoading(true);
    setError('');
    setMessage('');
    GroupOrderService.getAll()
      .then(response => {
        setGroupOrders(response.data);
        setLoading(false);
      })
      .catch(e => {
        setError(e.response?.data?.message || e.message || "Error fetching group orders");
        console.error(e);
        setLoading(false);
      });
  };

  const deleteGroupOrder = (id) => {
      if (window.confirm(`Are you sure you want to delete Group Order ${id}? This might fail if orders are associated with it.`)) {
          setLoading(true);
          GroupOrderService.delete(id)
              .then(() => {
                  setMessage(`Group Order ${id} deleted successfully.`);
                  setLoading(false);
                  retrieveGroupOrders(); // Refresh list
              })
              .catch(e => {
                  setError(e.response?.data?.message || e.message || `Error deleting Group Order ${id}`);
                  console.error(e);
                  setLoading(false);
              });
      }
  };

  const startGroupOrder = (id) => {
       if (window.confirm(`Are you sure you want to START Group Order ${id}? This will attempt to post to Facebook.`)) {
           setLoading(true);
           GroupOrderService.start(id)
               .then((response) => {
                   setMessage(`Group Order ${id} started. FB Post ID (if successful): ${response.data.facebookPostId || 'N/A'}`);
                   setLoading(false);
                   retrieveGroupOrders(); // Refresh list
               })
               .catch(e => {
                   setError(e.response?.data?.message || e.message || `Error starting Group Order ${id}`);
                   console.error(e);
                   setLoading(false);
               });
       }
  };

    const endGroupOrder = (id) => {
       if (window.confirm(`Are you sure you want to END Group Order ${id}?`)) {
           setLoading(true);
           GroupOrderService.end(id)
               .then(() => {
                   setMessage(`Group Order ${id} closed successfully.`);
                   setLoading(false);
                   retrieveGroupOrders(); // Refresh list
               })
               .catch(e => {
                   setError(e.response?.data?.message || e.message || `Error closing Group Order ${id}`);
                   console.error(e);
                   setLoading(false);
               });
       }
  };

  const reactivateGroupOrder = (id) => {
    if (window.confirm(`Are you sure you want to REACTIVATE Group Order ${id}?`)) {
        setLoading(true);
        GroupOrderService.reactivate(id)
            .then(() => {
                setMessage(`Group Order ${id} reactivated successfully.`);
                setLoading(false);
                retrieveGroupOrders(); // Refresh list
            })
            .catch(e => {
                setError(e.response?.data?.message || e.message || `Error reactivating Group Order ${id}`);
                console.error(e);
                setLoading(false);
            });
    }
  };


  return (
    <div>
      <h2>Group Orders</h2>
      <Link to="/group-orders/new" className="btn btn-primary mb-3">Create New Group Order</Link>

      {message && <div className="alert alert-success">{message}</div>}
      {loading && <p>Loading...</p>}
      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && (
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Status</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Products</th>
              <th>FB Post ID</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {groupOrders.map((order) => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.name}</td>
                <td>{order.status}</td>
                <td>{order.start_date ? new Date(order.start_date).toLocaleDateString() : '-'}</td>
                <td>{order.end_date ? new Date(order.end_date).toLocaleDateString() : '-'}</td>
                <td>{order.products?.length || 0}</td>
                <td>{order.facebook_post_id || '-'}</td>
                <td>
                  {order.status === 'Draft' &&
                    <button onClick={() => startGroupOrder(order.id)} className="btn btn-sm btn-success me-2">Start</button>
                  }
                  {order.status === 'Active' && (
                    <button onClick={() => endGroupOrder(order.id)} className="btn btn-sm btn-secondary me-2">End</button>
                  )}
                  {order.status === 'Closed' && (
                    <button onClick={() => reactivateGroupOrder(order.id)} className="btn btn-sm btn-warning me-2">Reactivate</button>
                  )}
                  <button onClick={() => {}} className="btn btn-sm btn-info me-2">
                    <Link to={`/purchase-list/${order.id}`} style={{ textDecoration: 'none', color: 'white' }}>Purchase</Link>
                  </button>
                  <button className="btn btn-sm btn-info me-2">
                    <Link to={`/shipment-intake/${order.id}`} style={{ textDecoration: 'none', color: 'white' }}>Stock</Link>
                  </button>
                  <button className="btn btn-sm btn-info me-2">
                    <Link to={`/packing-orders/${order.id}`} style={{ textDecoration: 'none', color: 'white' }}>Pack</Link>
                  </button>
                  <button className="btn btn-sm btn-info me-2">
                    <Link to={`/shipment-manifest/${order.id}`} style={{ textDecoration: 'none', color: 'white' }}>Manifest</Link>
                  </button>
                  <button className="btn btn-sm btn-info me-2">
                    <Link to={`/group-orders/edit/${order.id}`} style={{ textDecoration: 'none', color: 'white' }}>Edit</Link>
                  </button>
                  {/* Allow delete only if Draft? Or handle constraints in backend */}
                  <button onClick={() => deleteGroupOrder(order.id)} className="btn btn-sm btn-danger">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
       {!loading && groupOrders.length === 0 && <p>No group orders found.</p>}
    </div>
  );
};

export default GroupOrderList;
