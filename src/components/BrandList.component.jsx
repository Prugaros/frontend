import React, { useState, useEffect } from 'react';
import BrandService from '../services/brand.service';
import { Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const BrandList = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    retrieveBrands();
  }, []);

  const retrieveBrands = () => {
    setLoading(true);
    setError('');
    setMessage('');
    BrandService.getAll()
      .then(response => {
        setBrands(response.data);
        setLoading(false);
      })
      .catch(e => {
        setError(e.response?.data?.message || e.message || "Error fetching brands");
        setLoading(false);
      });
  };

  const handleActiveToggle = async (brandId, currentStatus) => {
    setError('');
    setMessage('');
    try {
      await BrandService.update(brandId, { isActive: !currentStatus });
      setMessage(`Brand ${brandId} active status updated successfully.`);
      retrieveBrands();
    } catch (e) {
      setError(e.response?.data?.message || e.message || `Error updating brand ${brandId} active status.`);
      retrieveBrands();
    }
  };

  const onDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;

    const items = Array.from(brands);
    const [reorderedItem] = items.splice(source.index, 1);
    items.splice(destination.index, 0, reorderedItem);

    setBrands(items);

    const brandIdsInNewOrder = items.map(b => b.id);

    try {
      await BrandService.updateOrder(brandIdsInNewOrder);
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Error updating brand order.");
      retrieveBrands(); // Revert on error
    }
  };

  const deleteBrand = (id) => {
    if (window.confirm(`Are you sure you want to delete brand ${id}? This cannot be undone.`)) {
      setLoading(true);
      BrandService.delete(id)
        .then(() => {
          setMessage(`Brand ${id} deleted successfully.`);
          retrieveBrands();
        })
        .catch(e => {
          setError(e.response?.data?.message || e.message || `Error deleting brand ${id}`);
          setLoading(false);
        });
    }
  };

  return (
    <div>
      <h2>Brand Management</h2>
      <Link to="/brands/new" className="btn btn-primary mb-3">Add New Brand</Link>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      {loading && <p>Loading brands...</p>}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="brands">
          {(provided) => (
            <table className="table table-striped table-hover" {...provided.droppableProps} ref={provided.innerRef}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Display Order</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {brands.map((brand, index) => (
                  <Draggable key={brand.id} draggableId={String(brand.id)} index={index}>
                    {(provided) => (
                      <tr ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                        <td>{brand.id}</td>
                        <td>{brand.name}</td>
                        <td>{brand.displayOrder}</td>
                        <td>
                          <input
                            type="checkbox"
                            checked={brand.isActive}
                            onChange={() => handleActiveToggle(brand.id, brand.isActive)}
                          />
                        </td>
                        <td>
                          <Link to={`/brands/edit/${brand.id}`} className="btn btn-sm btn-warning me-2">Edit</Link>
                          <button
                            onClick={() => deleteBrand(brand.id)}
                            className="btn btn-sm btn-danger"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </tbody>
            </table>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default BrandList;
