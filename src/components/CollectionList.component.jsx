import React, { useState, useEffect } from 'react';
import CollectionService from '../services/collection.service';
import { Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const CollectionList = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    retrieveCollections();
  }, []);

  const retrieveCollections = () => {
    setLoading(true);
    setError('');
    setMessage('');
    CollectionService.getAll()
      .then(response => {
        // Assuming the API returns collections sorted by DisplayOrder
        setCollections(response.data);
        setLoading(false);
      })
      .catch(e => {
        setError(e.response?.data?.message || e.message || "Error fetching collections");
        setLoading(false);
      });
  };

  const handleToggle = async (collectionId, field, currentValue) => {
    setError('');
    setMessage('');
    try {
      await CollectionService.update(collectionId, { [field]: !currentValue });
      setMessage(`Collection ${collectionId} ${field} status updated successfully.`);
      retrieveCollections();
    } catch (e) {
      setError(e.response?.data?.message || e.message || `Error updating collection ${collectionId}.`);
      retrieveCollections();
    }
  };

  const onDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;

    const items = Array.from(collections);
    const [reorderedItem] = items.splice(source.index, 1);
    items.splice(destination.index, 0, reorderedItem);

    setCollections(items);

    const collectionIdsInNewOrder = items.map(c => c.id);

    try {
      // This endpoint needs to be created in the backend
      await CollectionService.updateOrder(collectionIdsInNewOrder);
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Error updating collection order.");
      retrieveCollections(); // Revert on error
    }
  };

  const deleteCollection = (id) => {
    if (window.confirm(`Are you sure you want to delete collection ${id}? This cannot be undone.`)) {
      setLoading(true);
      CollectionService.delete(id)
        .then(() => {
          setMessage(`Collection ${id} deleted successfully.`);
          retrieveCollections();
        })
        .catch(e => {
          setError(e.response?.data?.message || e.message || `Error deleting collection ${id}`);
          setLoading(false);
        });
    }
  };

  return (
    <div>
      <h2>Collection Management</h2>
      <Link to="/collections/new" className="btn btn-primary mb-3">Add New Collection</Link>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      {loading && <p>Loading collections...</p>}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="collections">
          {(provided) => (
            <table className="table table-striped table-hover" {...provided.droppableProps} ref={provided.innerRef}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Display Order</th>
                  <th>Active</th>
                  <th>Featured</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {collections.map((collection, index) => (
                  <Draggable key={collection.id} draggableId={String(collection.id)} index={index}>
                    {(provided) => (
                      <tr ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                        <td>{collection.id}</td>
                        <td>{collection.Name}</td>
                        <td>{collection.DisplayOrder}</td>
                        <td>
                          <input
                            type="checkbox"
                            checked={collection.isActive}
                            onChange={() => handleToggle(collection.id, 'isActive', collection.isActive)}
                          />
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            checked={collection.is_featured}
                            onChange={() => handleToggle(collection.id, 'is_featured', collection.is_featured)}
                          />
                        </td>
                        <td>
                          <Link to={`/collections/edit/${collection.id}`} className="btn btn-sm btn-warning me-2">Edit</Link>
                          <button
                            onClick={() => deleteCollection(collection.id)}
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

export default CollectionList;
