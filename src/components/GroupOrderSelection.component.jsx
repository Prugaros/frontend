import React, { useState, useEffect } from 'react';
import WebviewService from '../services/webview.service';
import './GroupOrderSelection.component.css';

const GroupOrderSelection = ({ psid, onGroupOrderSelected }) => {
    const [groupOrders, setGroupOrders] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchGroupOrders = async () => {
            try {
                const response = await WebviewService.getActiveGroupOrders();
                if (response.data && response.data.length > 0) {
                    if (response.data.length === 1) {
                        // If only one group order, select it automatically
                        handleSelectGroupOrder(response.data[0].id);
                    } else {
                        setGroupOrders(response.data);
                    }
                } else {
                    setError('No active group orders found.');
                }
            } catch (err) {
                setError('Failed to fetch group orders.');
                console.error(err);
            }
        };

        fetchGroupOrders();
    }, [psid, onGroupOrderSelected]);

    const handleSelectGroupOrder = async (groupOrderId) => {
        try {
            await WebviewService.setGroupOrder(psid, groupOrderId);
            onGroupOrderSelected();
        } catch (err) {
            setError('Failed to set group order.');
            console.error(err);
        }
    };

    if (error) {
        return <div className="group-order-selection-container"><p className="error">{error}</p></div>;
    }

    if (groupOrders.length === 0) {
        return <div className="group-order-selection-container"><p>Loading group orders...</p></div>;
    }

    return (
        <div className="group-order-selection-container">
            <h2>Select a Group Order</h2>
            <div className="group-order-buttons">
                {groupOrders.map(order => (
                    <button key={order.id} onClick={() => handleSelectGroupOrder(order.id)} className="group-order-button">
                        {order.name}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default GroupOrderSelection;
