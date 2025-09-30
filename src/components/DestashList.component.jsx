import React, { useState, useEffect } from 'react';
import CustomerService from '../services/customer.service';

const DestashListComponent = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        CustomerService.getDestashList()
            .then(response => {
                console.log('API Response:', response.data);
                setCustomers(response.data);
                setLoading(false);
            })
            .catch(error => {
                setError(error.message || "Error fetching destash list.");
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="container">
            <h2>Destash Notification List</h2>
            <table className="table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                    </tr>
                </thead>
                <tbody>
                    {customers.map((customer, index) => (
                        <tr key={index}>
                            <td>{customer.name}</td>
                            <td>{customer.email}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DestashListComponent;
