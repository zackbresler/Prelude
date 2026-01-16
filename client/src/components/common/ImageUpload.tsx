import { useCallback, useState } from 'react';
import Button from './Button';

interface ImageItem {
  id: string;
  url: string;
  caption: string;
}

interface ImageUploadProps {
  images: ImageItem[];
  onAdd: (image: Omit<ImageItem, 'id'>) => void;
  onUpdate: (id: string, image: Partial<ImageItem>) => void;
  onDelete: (id: string) => void;
  label?: string;
}

export default function ImageUpload({ images, onAdd, onUpdate, onDelete, label }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        onAdd({ url, caption: file.name });
      };
      reader.readAsDataURL(file);
    },
    [onAdd]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processFile(e.dataTransfer.files[0]);
      }
    },
    [processFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        processFile(e.target.files[0]);
      }
    },
    [processFile]
  );

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>}

      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive ? 'border-primary-500 bg-primary-600/10' : 'border-surface-50 hover:border-surface-50/70'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          id="image-upload"
        />
        <label htmlFor="image-upload" className="cursor-pointer">
          <div className="text-gray-400">
            <svg
              className="mx-auto h-12 w-12 text-gray-500"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-2 text-sm">Drag and drop an image, or click to select</p>
          </div>
        </label>
      </div>

      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-4">
          {images.map((image) => (
            <div key={image.id} className="relative group border border-surface-100 rounded-lg overflow-hidden bg-surface-200">
              <img
                src={image.url}
                alt={image.caption}
                className="w-full h-40 object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
                <Button
                  variant="danger"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onDelete(image.id)}
                >
                  Remove
                </Button>
              </div>
              <input
                type="text"
                value={image.caption}
                onChange={(e) => onUpdate(image.id, { caption: e.target.value })}
                placeholder="Add caption..."
                className="w-full px-3 py-2 text-sm bg-surface-300 text-gray-100 placeholder-gray-500 border-t border-surface-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
