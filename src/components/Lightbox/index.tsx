import React from 'react';

interface LightboxProps {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

const Lightbox: React.FC<LightboxProps> = ({ src, alt, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-75">
      <div className="relative max-w-4xl mx-auto">
        <button
          className="absolute top-4 right-4 text-slate-800 text-3xl font-bold"
          onClick={onClose}
        >
          &times;
        </button>
        <img
          src={src}
          alt={alt}
          className="object-contain max-h-[80vh] max-w-full"
        />
      </div>
    </div>
  );
};

export default Lightbox;