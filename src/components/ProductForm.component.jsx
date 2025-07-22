import React, { useState, useEffect } from 'react';
import ProductService from '../services/product.service';
import CollectionService from '../services/collection.service';
import { useParams, useNavigate } from 'react-router-dom';
import StockManagement from './StockManagement';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import DraggableImage from './DraggableImage';

const ProductForm = () => {
  const { id } = useParams(); // Get ID from URL for editing
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const initialProductState = {
    name: '',
    description: '',
    price: '',
    images: [], // All images will be stored here
    weight_oz: '',
    is_active: true,
  };
  const [product, setProduct] = useState(initialProductState);
  const [newlySelectedFiles, setNewlySelectedFiles] = useState([]); // For raw File objects selected in the input
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await CollectionService.getAll();
        setCollections(response.data);
      } catch (error) {
        console.error("Error fetching collections:", error);
        setMessage("Error fetching collections: " + (error.response?.data?.message || error.message));
      }
    };

    fetchCollections();

    if (isEditing) {
      setLoading(true);
      ProductService.get(id)
        .then(response => {
          setProduct({
            ...response.data,
            price: response.data.price || '',
            weight_oz: response.data.weight_oz || '',
            description: response.data.description || '',
            images: response.data.images || [], // Load existing images
          });
          setLoading(false);
        })
        .catch(e => {
          setMessage("Error fetching product: " + (e.response?.data?.message || e.message));
          setLoading(false);
        });
    } else {
      // Reset to initial state if navigating from edit to new
      setProduct(initialProductState);
      setNewlySelectedFiles([]); // Clear selected files on new product form
    }
  }, [id, isEditing]); // Re-run if ID changes (navigating between edit/new)

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setProduct({ ...product, [name]: type === 'checkbox' ? checked : value });
  };

  const handleFileChange = (event) => {
    setNewlySelectedFiles(prevFiles => [...prevFiles, ...Array.from(event.target.files)]);
  };

  const onDragEnd = (result) => {
    if (!result.destination) {
      return;
    }

    const combinedImages = [
      ...product.images.map(url => ({ type: 'existing', value: url })),
      ...newlySelectedFiles.map(file => ({ type: 'new', value: file }))
    ];

    const [movedItem] = combinedImages.splice(result.source.index, 1);
    combinedImages.splice(result.destination.index, 0, movedItem);

    const updatedExistingImages = combinedImages
      .filter(item => item.type === 'existing')
      .map(item => item.value);

    const updatedNewlySelectedFiles = combinedImages
      .filter(item => item.type === 'new')
      .map(item => item.value);

    setProduct({ ...product, images: updatedExistingImages });
    setNewlySelectedFiles(updatedNewlySelectedFiles);
  };

  const uploadFiles = async (files) => {
    if (files.length === 0) {
      return [];
    }

    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file); // 'images' must match the field name in multer upload.array
    });

    try {
      const response = await ProductService.uploadImages(formData);
      return response.data.imageUrls;
    } catch (error) {
      console.error("Error uploading images:", error);
      setMessage("Error uploading images: " + (error.response?.data?.message || error.message));
      return []; // Return an empty array on failure to prevent TypeError
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    let finalImageUrls = product.images; // Start with existing images (potentially reordered)

    // Upload newly selected files
    if (newlySelectedFiles.length > 0) {
      const uploadedNewUrls = await uploadFiles(newlySelectedFiles);
      if (uploadedNewUrls === null) { // If upload failed
        setLoading(false);
        return;
      }
      finalImageUrls = [...finalImageUrls, ...uploadedNewUrls]; // Add new URLs to the end
    }

    // Prepare data, ensuring numeric fields are numbers or null
    const dataToSubmit = {
        ...product,
        price: parseFloat(product.price) || 0,
        weight_oz: product.weight_oz ? parseFloat(product.weight_oz) : null,
        collectionId: product.collectionId === '' ? null : parseInt(product.collectionId),
        images: finalImageUrls, // Send the complete, ordered list of image URLs
    };

    const saveAction = isEditing
      ? ProductService.update(id, dataToSubmit)
      : ProductService.create(dataToSubmit);

    saveAction
      .then(() => {
        navigate('/products');
      })
      .catch(e => {
        setMessage(e.response?.data?.message || e.message || "Error saving product");
        setLoading(false);
      });
  };

  if (loading && isEditing) return <p>Loading product...</p>;

  return (
    <div>
      <h2>{isEditing ? 'Edit' : 'Create'} Product</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="name" className="form-label">Name</label>
          <input type="text" className="form-control" id="name" name="name" value={product.name} onChange={handleInputChange} required />
        </div>
        <div className="mb-3">
          <label htmlFor="description" className="form-label">Description</label>
          <textarea className="form-control" id="description" name="description" value={product.description} onChange={handleInputChange} />
        </div>
         <div className="row">
            <div className="col-md-6 mb-3">
                <label htmlFor="price" className="form-label">Price ($)</label>
                <input type="number" step="0.01" className="form-control" id="price" name="price" value={product.price} onChange={handleInputChange} required />
            </div>
             <div className="col-md-6 mb-3">
                <label htmlFor="weight_oz" className="form-label">Weight (oz)</label>
                <input type="number" step="0.1" className="form-control" id="weight_oz" name="weight_oz" value={product.weight_oz} onChange={handleInputChange} />
            </div>
         </div>
        <div className="mb-3">
          <label htmlFor="images_upload" className="form-label">Product Images (Drag to reorder)</label>
          <input type="file" className="form-control" id="images_upload" name="images_upload" multiple onChange={handleFileChange} />
          {(product.images.length > 0 || newlySelectedFiles.length > 0) && (
            <div className="mt-2">
              <p>Current and newly selected images:</p>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="images-droppable" direction="vertical" isDropDisabled={false} isCombineEnabled={false} ignoreContainerClipping={false}>
                  {(provided) => (
                    <div
                      className="d-flex flex-column"
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                    >
                      {product.images.map((imgUrl, index) => (
                        <DraggableImage
                          key={imgUrl}
                          imageUrl={imgUrl}
                          index={index}
                          isNew={false}
                          totalExistingImages={product.images.length}
                        />
                      ))}
                      {newlySelectedFiles.map((file, index) => (
                        <DraggableImage
                          key={`${file.name}-${file.lastModified}-${index}`} // Generate unique key for Draggable
                          file={file}
                          index={index}
                          isNew={true}
                          totalExistingImages={product.images.length}
                        />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          )}
        </div>
         <div className="mb-3 form-check">
            <input type="checkbox" className="form-check-input" id="is_active" name="is_active" checked={product.is_active} onChange={handleInputChange} />
            <label className="form-check-label" htmlFor="is_active">Active (available for new group orders)</label>
        </div>

        <div className="mb-3">
          <label htmlFor="collectionId" className="form-label">Collection</label>
          <select
            className="form-control"
            id="collectionId"
            name="collectionId"
            value={product.collectionId || ''}
            onChange={handleInputChange}
          >
            <option value="">No Collection</option>
            {collections.map(collection => (
              <option key={collection.id} value={collection.id}>{collection.Name}</option>
            ))}
          </select>
        </div>

        {message && <div className="alert alert-danger">{message}</div>}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving...' : 'Save Product'}
        </button>
        <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate('/products')}>
          Cancel
        </button>
      </form>
      {isEditing && (
        <StockManagement productId={id} />
      )}
    </div>
  );
};

export default ProductForm;
