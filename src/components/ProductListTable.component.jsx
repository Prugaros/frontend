import React, { useState, useEffect, useCallback } from 'react';
import ProductService from '../services/product.service';
import { Link, useParams } from 'react-router-dom'; // Import useParams
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'; // Use @hello-pangea/dnd
import _ from 'lodash'; // For grouping and sorting
import './ProductListTable.component.css'; // Import new CSS file

const ProductListTable = () => {
  const { collectionId } = useParams(); // Get collectionId from URL params
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    retrieveProducts();
  }, [collectionId]); // Only re-fetch when collectionId changes

  const retrieveProducts = () => {
    console.log('retrieveProducts called');
    setLoading(true);
    setError('');
    setMessage('');

    let filters = {};
    if (collectionId) {
      filters.collectionId = collectionId; // Add collectionId to filters
    }

    ProductService.getAll(filters) // searchTerm is removed from query
      .then(response => {
        console.log('ProductService.getAll response:', response.data);
        let fetchedProducts = response.data;
        if (collectionId) {
          // Filter products by collectionId if present
          fetchedProducts = fetchedProducts.filter(product => product.collectionId === parseInt(collectionId));
        }
        // Sort by collectionProductOrder for display (descending for "top")
        fetchedProducts.sort((a, b) => b.collectionProductOrder - a.collectionProductOrder);

        setProducts(fetchedProducts);
        // setFilteredProducts is handled by the other useEffect
        console.log('Products state updated:', fetchedProducts);
        setLoading(false);
      })
      .catch(e => {
        setError(e.response?.data?.message || e.message || "Error fetching products");
        console.error('Error fetching products:', e);
        setLoading(false);
      });
  };

  useEffect(() => {
    console.log('useEffect (products, searchTerm) triggered. Current products:', products);
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.collection && product.collection.Name && product.collection.Name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    // Re-apply sorting by collectionProductOrder when products or searchTerm changes
    filtered.sort((a, b) => b.collectionProductOrder - a.collectionProductOrder);

    setFilteredProducts(filtered);
    console.log('Filtered products updated:', filtered);
  }, [searchTerm, products]);

  const handleActiveToggle = async (productId, currentStatus) => {
    setError('');
    setMessage('');
    try {
      await ProductService.update(productId, { is_active: !currentStatus });
      setMessage(`Product ${productId} active status updated successfully.`);
      // Re-fetch products to ensure backend order is reflected and collectionProductOrder values are correct
      retrieveProducts();
    } catch (e) {
      setError(e.response?.data?.message || e.message || `Error updating product ${productId} active status.`);
      console.error(e);
      setLoading(false);
      // Re-fetch products on error to revert if update failed
      retrieveProducts();
    }
  };

  const handleFeaturedToggle = async (productId, currentStatus) => {
    setError('');
    setMessage('');
    try {
      await ProductService.update(productId, { is_featured: !currentStatus });
      setMessage(`Product ${productId} featured status updated successfully.`);
      retrieveProducts();
    } catch (e) {
      setError(e.response?.data?.message || e.message || `Error updating product ${productId} featured status.`);
      retrieveProducts();
    }
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId, type } = result;

    if (!destination) {
      return;
    }

    // If dragging within the same droppable (i.e., within the same collection)
    if (source.droppableId === destination.droppableId && type === 'product') {
      const collectionName = source.droppableId;
      const currentCollectionProducts = Array.from(groupedProducts[collectionName]);
      const [movedProduct] = currentCollectionProducts.splice(source.index, 1);
      currentCollectionProducts.splice(destination.index, 0, movedProduct);

      // Calculate new collectionProductOrder values for the reordered products
      // Assuming backend assigns orders from N-1 down to 0 for display (highest order first)
      const updatedCollectionProducts = currentCollectionProducts.map((product, index) => ({
        ...product,
        collectionProductOrder: currentCollectionProducts.length - 1 - index,
      }));

      // Create a map for quick lookup of updated products in the current collection
      const updatedProductsMap = new Map(updatedCollectionProducts.map(p => [p.id, p]));

      // Construct the new 'products' array by replacing updated products and keeping others as is
      const newProducts = products.map(product => {
        if (product.collection && product.collection.Name === collectionName) {
          // If this product belongs to the reordered collection, use its updated version
          return updatedProductsMap.get(product.id) || product;
        }
        return product; // Otherwise, keep the product as is
      });

      // Now, re-sort the newProducts array based on the updated collectionProductOrder values
      // This is crucial because the `products` state is used by `useEffect` and `groupedProducts`
      newProducts.sort((a, b) => b.collectionProductOrder - a.collectionProductOrder);

      setProducts(newProducts);
      setFilteredProducts(newProducts); // Also update filtered products

      const productIdsInNewOrder = updatedCollectionProducts.map(p => p.id);
      const targetCollectionId = products.find(p => p.collection && p.collection.Name === collectionName)?.collection.id;

      if (targetCollectionId) {
        try {
          await ProductService.updateCollectionProductOrder(targetCollectionId, productIdsInNewOrder);
          // Removed retrieveProducts() call here to prevent flicker. Local state is already updated.
        } catch (e) {
          setError(e.response?.data?.message || e.message || "Error updating product order.");
          console.error(e);
          setLoading(false);
          // Revert to original order if backend update fails
          retrieveProducts();
        }
      }
    }
    // TODO: Handle dragging between collections if needed in the future
  };

  const deleteProduct = (id) => {
    if (window.confirm(`Are you sure you want to delete product ${id}? This cannot be undone.`)) {
      setLoading(true);
      ProductService.delete(id)
        .then(() => {
          setMessage(`Product ${id} deleted successfully.`);
          // Update local state to remove the deleted product
          setProducts(prevProducts => prevProducts.filter(product => product.id !== id));
          setFilteredProducts(prevFilteredProducts => prevFilteredProducts.filter(product => product.id !== id));
          setLoading(false);
        })
        .catch(e => {
          setError(e.response?.data?.message || e.message || `Error deleting product ${id}`);
          console.error(e);
          setLoading(false);
          // No need to retrieveProducts here, as the local state is already updated
          // and we don't want a full page refresh on error.
        });
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Group products by Collection
  const groupedProducts = filteredProducts.reduce((groups, product) => {
    const collection = product.collection ? product.collection.Name : 'Uncategorized';
    if (!groups[collection]) {
      groups[collection] = [];
    }
    groups[collection].push(product);
    return groups;
  }, {});

  // Sort collections by DisplayOrder
  const sortedCollections = Object.keys(groupedProducts).sort((a, b) => {
    const collectionA = products.find(p => p.collection && p.collection.Name === a)?.collection;
    const collectionB = products.find(p => p.collection && p.collection.Name === b)?.collection;

    if (!collectionA && !collectionB) {
      return a.localeCompare(b); // Sort alphabetically if DisplayOrder is not available
    } else if (!collectionA) {
      return 1; // Move items without DisplayOrder to the end
    } else if (!collectionB) {
      return -1;
    } else {
      return (collectionA.DisplayOrder || 0) - (collectionB.DisplayOrder || 0); // Sort by DisplayOrder, default to 0 if null
    }
  });

  return (
    <div>
      <h2>Product Management</h2>
      <Link to="/products/new" className="btn btn-primary mb-3">Add New Product</Link>

      {/* Search Bar */}
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Search by name or collection"
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      {/*loading && <p>Loading products...</p>*/}

      <DragDropContext onDragEnd={onDragEnd}>
        {sortedCollections.length > 0 ? (
          sortedCollections.map(collection => (
            <div key={collection} className="mb-4">
              <h4>{collection}</h4>
              <div className="product-table-container">
                <div className="product-table-header">
                  <div className="product-table-row header-row">
                    <div className="product-table-cell header-cell">ID</div>
                    <div className="product-table-cell header-cell">Name</div>
                    <div className="product-table-cell header-cell">Price</div>
                    <div className="product-table-cell header-cell">Weight (oz)</div>
                    <div className="product-table-cell header-cell">Active</div>
                    <div className="product-table-cell header-cell">Featured</div>
                    <div className="product-table-cell header-cell">Actions</div>
                  </div>
                </div>
                <Droppable droppableId={collection} type="product">
                  {(provided) => (
                    <div
                      className="product-table-body"
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                    >
                      {groupedProducts[collection].length > 0 ? (
                        groupedProducts[collection].map((product, index) => (
                          <Draggable key={product.id} draggableId={String(product.id)} index={index}>
                            {(draggableProvided) => (
                              <div
                                ref={draggableProvided.innerRef}
                                {...draggableProvided.draggableProps}
                                {...draggableProvided.dragHandleProps}
                                style={{
                                  ...draggableProvided.draggableProps.style,
                                }}
                              >
                                <div className="product-table-row">
                                  <div className="product-table-cell">{product.id}</div>
                                  <div className="product-table-cell">{product.name}</div>
                                  <div className="product-table-cell">${product.price}</div>
                                  <div className="product-table-cell">{product.weight_oz || '-'}</div>
                                  <div className="product-table-cell">
                                    <input
                                      type="checkbox"
                                      checked={product.is_active}
                                      onChange={() => handleActiveToggle(product.id, product.is_active)}
                                    />
                                  </div>
                                  <div className="product-table-cell">
                                    <input
                                      type="checkbox"
                                      checked={product.is_featured}
                                      onChange={() => handleFeaturedToggle(product.id, product.is_featured)}
                                    />
                                  </div>
                                  <div className="product-table-cell">
                                    <Link to={`/products/edit/${product.id}`} className="btn btn-sm btn-warning me-2">Edit</Link>
                                    <button
                                      onClick={() => deleteProduct(product.id)}
                                      className="btn btn-sm btn-danger"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))
                      ) : (
                        <p className="p-3">No products found in this collection.</p>
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          ))
        ) : (
          <p>No collections found.</p>
        )}
      </DragDropContext>
    </div>
  );
};

export default ProductListTable;
