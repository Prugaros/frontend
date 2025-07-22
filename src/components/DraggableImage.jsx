import React from 'react';
import { Draggable } from '@hello-pangea/dnd';

const DraggableImage = ({ imageUrl, file, index, isNew, totalExistingImages }) => {
  // If it's a new file, 'file' is the File object itself. If it's an existing URL, 'imageUrl' is the ID.
  const draggableId = isNew ? `${file.name}-${file.lastModified}-${index}` : imageUrl; // Use a stable ID for new files
  const src = isNew ? URL.createObjectURL(file) : imageUrl; // Use 'file' directly for new files
  const displayIndex = isNew ? totalExistingImages + index : index;

  return (
    <Draggable key={draggableId} draggableId={draggableId} index={displayIndex}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            border: isNew ? '1px dashed #ccc' : (index === 0 ? '2px solid blue' : '1px solid #ddd'),
            position: 'relative',
            cursor: 'grab',
            ...provided.draggableProps.style, // Ensure draggableProps.style is applied last
          }}
        >
          <img src={src} alt={`Product image ${displayIndex + 1}`} style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
          {index === 0 && !isNew && <span style={{ position: 'absolute', top: '5px', left: '5px', background: 'blue', color: 'white', padding: '2px 5px', borderRadius: '3px', fontSize: '0.7em' }}>Main</span>}
          {isNew && <span style={{ position: 'absolute', top: '5px', left: '5px', background: 'green', color: 'white', padding: '2px 5px', borderRadius: '3px', fontSize: '0.7em' }}>New</span>}
        </div>
      )}
    </Draggable>
  );
};

export default DraggableImage;
