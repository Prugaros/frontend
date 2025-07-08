import React, { useState, useEffect } from 'react';
import { getStockLevel, addStock, subtractStock, adjustStock } from '../services/product.service';

const StockManagement = ({ productId }) => {
  const [stockLevel, setStockLevel] = useState(0);
  const [addQuantity, setAddQuantity] = useState('');
  const [subtractQuantity, setSubtractQuantity] = useState('');
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchStockLevel();
  }, [productId]);

  const fetchStockLevel = async () => {
    try {
      const response = await getStockLevel(productId);
      setStockLevel(response.quantityInStock);
    } catch (error) {
      console.error('Error fetching stock level:', error);
    }
  };

  const handleAddStock = async () => {
    try {
      await addStock(productId, { quantity: parseInt(addQuantity), description });
      fetchStockLevel();
      setAddQuantity('');
      setDescription('');
    } catch (error) {
      console.error('Error adding stock:', error);
    }
  };

  const handleSubtractStock = async () => {
    try {
      await subtractStock(productId, { quantity: parseInt(subtractQuantity), description });
      fetchStockLevel();
      setSubtractQuantity('');
      setDescription('');
    } catch (error) {
      console.error('Error subtracting stock:', error);
    }
  };

  const handleAdjustStock = async () => {
    try {
      await adjustStock(productId, { quantity: parseInt(adjustQuantity), description });
      fetchStockLevel();
      setAdjustQuantity('');
      setDescription('');
    } catch (error) {
      console.error('Error adjusting stock:', error);
    }
  };

  return (
    <div>
      <h3>Stock Management</h3>
      <p>Current Stock Level: {stockLevel}</p>

      <div>
        <input
          type="number"
          placeholder="Quantity to Add"
          value={addQuantity}
          onChange={(e) => setAddQuantity(e.target.value)}
        />
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button onClick={handleAddStock}>Add Stock</button>
      </div>

      <div>
        <input
          type="number"
          placeholder="Quantity to Subtract"
          value={subtractQuantity}
          onChange={(e) => setSubtractQuantity(e.target.value)}
        />
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button onClick={handleSubtractStock}>Subtract Stock</button>
      </div>

      <div>
        <input
          type="number"
          placeholder="Adjust Stock Level To"
          value={adjustQuantity}
          onChange={(e) => setAdjustQuantity(e.target.value)}
        />
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button onClick={handleAdjustStock}>Adjust Stock</button>
      </div>
    </div>
  );
};

export default StockManagement;
