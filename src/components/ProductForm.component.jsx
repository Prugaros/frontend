import React, { useState, useEffect } from 'react';
import ProductService from '../services/product.service';
import CollectionService from '../services/collection.service';
import BrandService from '../services/brand.service';
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
    product_url: '',
    description: '',
    price: '',
    images: [], // All images will be stored here
    weight_oz: '',
    is_active: true,
    brandId: '',
  };
  const [product, setProduct] = useState(initialProductState);
  const [newlySelectedFiles, setNewlySelectedFiles] = useState([]); // For raw File objects selected in the input
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [brands, setBrands] = useState([]);
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    const fetchAndSetData = async () => {
      setLoading(true);
      try {
        // 1. Fetch all brands. This is needed for both create and edit modes.
        const brandsResponse = await BrandService.getAll();
        setBrands(brandsResponse.data);

        if (isEditing) {
          // 2. If editing, fetch the specific product.
          const productResponse = await ProductService.get(id);
          const fetchedProduct = { ...productResponse.data };

          // 3. Normalize the product data for the form state.
          const brandId = fetchedProduct.brand?.id;
          const collectionId = fetchedProduct.collection?.id;
          fetchedProduct.brandId = brandId || '';
          fetchedProduct.collectionId = collectionId || '';

          // 4. If a brand is associated with the product, fetch its collections.
          if (brandId) {
            const collectionsResponse = await CollectionService.getAll({ brandId });
            setCollections(collectionsResponse.data);
          } else {
            setCollections([]);
          }

          // 5. Set the fully prepared product state.
          setProduct(fetchedProduct);
        } else {
          // If creating a new product, just use the initial empty state.
          setProduct(initialProductState);
          setCollections([]);
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message;
        setMessage(`Error fetching data: ${errorMessage}`);
        console.error("Error fetching initial data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndSetData();
  }, [id, isEditing]);

  const handleInputChange = async (event) => {
    const { name, value, type, checked } = event.target;
    const newProductState = { ...product, [name]: type === 'checkbox' ? checked : value };

    // If the brand is changed, we must reset the collection and fetch new ones.
    if (name === 'brandId') {
      newProductState.collectionId = ''; // Reset collection selection
      if (value) { // If a new brand is selected (not "Select a Brand")
        try {
          const response = await CollectionService.getAll({ brandId: value });
          setCollections(response.data);
        } catch (error) {
          console.error("Error fetching collections for brand:", error);
          setCollections([]);
        }
      } else { // If the brand is cleared
        setCollections([]);
      }
    }

    setProduct(newProductState);
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
        brandId: parseInt(product.brandId),
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
          <label htmlFor="product_url" className="form-label">Product URL</label>
          <input type="text" className="form-control" id="product_url" name="product_url" value={product.product_url} onChange={handleInputChange} required />
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
          <label htmlFor="brandId" className="form-label">Brand</label>
          <select
            className="form-control"
            id="brandId"
            name="brandId"
            value={product.brandId || ''}
            onChange={handleInputChange}
            required
          >
            <option value="">Select a Brand</option>
            {brands.map(brand => (
              <option key={brand.id} value={brand.id}>{brand.name}</option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label htmlFor="collectionId" className="form-label">Collection</label>
          <select
            className="form-control"
            id="collectionId"
            name="collectionId"
            value={product.collectionId || ''}
            onChange={handleInputChange}
            disabled={!product.brandId}
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
