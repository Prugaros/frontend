import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import WebviewService from '../services/webview.service';
import './OrderStatus.component.css';

// ── Friendly label maps ────────────────────────────────────────────────────
const PAYMENT_LABELS = {
  'Invoice Sent':     { label: 'Awaiting payment',         emoji: '🕐' },
  'Payment Claimed':  { label: 'Payment received — confirming', emoji: '🔄' },
  'Paid':             { label: 'Confirmed',                 emoji: '✅' },
  'Error':            { label: 'Payment issue — contact us', emoji: '⚠️' },
  'Cancelled':        { label: 'Cancelled',                 emoji: '❌' },
};

const SHIPPING_LABELS = {
  'Pending':    { label: 'Preparing your order',       emoji: '📋' },
  'Processing': { label: 'Processing',                 emoji: '⚙️' },
  'Packed':     { label: 'Packed and ready to ship',  emoji: '📦' },
  'Shipped':    { label: 'On the way!',               emoji: '🚚' },
  'Delivered':  { label: 'Delivered',                  emoji: '🎉' },
  'Issue':      { label: 'Shipping issue — contact us', emoji: '⚠️' },
};

function StatusBadge({ status, labelMap }) {
  const info = labelMap[status] || { label: status, emoji: '•' };
  return (
    <span className="os-status-badge">
      {info.emoji} {info.label}
    </span>
  );
}

export default function OrderStatus() {
  const [searchParams] = useSearchParams();
  const psid = searchParams.get('psid');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!psid) {
      setError('Missing customer link. Please access this page from Messenger.');
      setLoading(false);
      return;
    }

    WebviewService.getOrderStatus(psid)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading order status:', err);
        setError('Could not load your orders. Please try again or contact us.');
        setLoading(false);
      });
  }, [psid]);

  if (loading) {
    return (
      <div className="os-container">
        <div className="os-loading">Loading your orders…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="os-container">
        <div className="os-error">{error}</div>
        <a className="os-contact-link" href="https://m.me/naomi.seijo.2025">
          Contact us on Messenger
        </a>
      </div>
    );
  }

  if (!data || data.orders.length === 0) {
    return (
      <div className="os-container">
        <h1 className="os-title">Your Orders</h1>
        <p className="os-empty">No orders found.</p>
      </div>
    );
  }

  return (
    <div className="os-container">
      <h1 className="os-title">
        {data.customerName ? `Hi, ${data.customerName.split(' ')[0]}!` : 'Your Orders'}
      </h1>
      <p className="os-subtitle">{data.orders.length} order{data.orders.length !== 1 ? 's' : ''} found</p>

      {data.orders.map(order => (
        <div key={order.id} className="os-order-card">

          {/* Header */}
          <div className="os-order-header">
            <div className="os-group-name">{order.groupOrderName}</div>
            <div className="os-order-date">
              {new Date(order.orderDate).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
              })}
            </div>
          </div>

          {/* Status badges */}
          <div className="os-badges">
            <StatusBadge status={order.payment_status} labelMap={PAYMENT_LABELS} />
            {order.shipping_status && order.payment_status === 'Paid' && (
              <StatusBadge status={order.shipping_status} labelMap={SHIPPING_LABELS} />
            )}
          </div>

          {/* Items */}
          <div className="os-items">
            {order.items.map((item, i) => {
              const netQty = item.quantity - (item.refundedQty || 0);
              if (netQty <= 0) return null;
              return (
                <div key={i} className="os-item-row">
                  <span className="os-item-name">{item.name}</span>
                  <span className="os-item-qty">×{netQty}</span>
                  <span className="os-item-total">${(netQty * item.price).toFixed(2)}</span>
                </div>
              );
            })}
          </div>

          {/* Refunded items */}
          {order.items.some(i => i.refundedQty > 0) && (
            <div className="os-refunds">
              <div className="os-refunds-label">Refunded items:</div>
              {order.items.filter(i => i.refundedQty > 0).map((item, i) => (
                <div key={i} className="os-item-row os-item-refunded">
                  <span className="os-item-name">{item.name}</span>
                  <span className="os-item-qty">×{item.refundedQty}</span>
                  <span className="os-item-total os-refund-amount">
                    −${(item.refundedQty * item.price).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Totals */}
          <div className="os-totals">
            <div className="os-total-row">
              <span>Subtotal</span><span>${order.subtotal}</span>
            </div>
            <div className="os-total-row">
              <span>Shipping</span><span>${order.shipping}</span>
            </div>
            {parseFloat(order.appliedCredit) > 0 && (
              <div className="os-total-row os-credit-row">
                <span>Store Credit Applied</span><span>−${order.appliedCredit}</span>
              </div>
            )}
            <div className="os-total-row os-grand-total">
              <span>Total</span><span>${order.total}</span>
            </div>
          </div>

          {/* Active Notice */}
          {order.groupOrderIsActive && (
            <div className="os-active-notice">
              <p>This group order is still open!</p>
              <a href={`/messenger-order?psid=${psid}`} className="os-active-link">
                Shop more for no additional shipping charge →
              </a>
            </div>
          )}

        </div>
      ))}

      <a className="os-contact-link" href="https://m.me/naomi.seijo.2025">
        Questions? Message us →
      </a>
    </div>
  );
}
