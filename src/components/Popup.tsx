import React, { ReactNode, useEffect } from 'react';

interface BlurPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: string;
  showCloseButton?: boolean;
  colors?: any; // Add colors prop
}

const BlurPopup: React.FC<BlurPopupProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-md',
  showCloseButton = true,
  colors = {}
}) => {
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when popup is open
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll when popup is closed
      document.body.style.overflow = 'unset';
    }

    // Cleanup function to restore scroll on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Blurred Background Overlay */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
      />
      
      {/* Popup Content */}
      <div 
        className={`relative bg-white rounded-lg shadow-2xl ${maxWidth} w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out animate-popup`}
        style={{
          position: 'relative',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: maxWidth === 'max-w-md' ? '28rem' : '32rem',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          transform: 'scale(1)',
          animation: 'popupFadeIn 0.3s ease-out'
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "popup-title" : undefined}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div 
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              borderBottom: `1px solid ${colors.border || '#e5e7eb'}`
            }}
          >
            {title && (
              <h2 
                id="popup-title" 
                style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: colors.textPrimary || '#111827',
                  margin: 0
                }}
              >
                {title}
              </h2>
            )}
            {!title && <div></div>} {/* Spacer when no title */}
            {showCloseButton && (
              <button
                onClick={onClose}
                aria-label="Close popup"
                style={{
                  background: 'none',
                  border: 'none',
                  color: colors.textLight || '#9ca3af',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.2s ease',
                  fontSize: '24px',
                  lineHeight: '1',
                  width: '32px',
                  height: '32px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = colors.textSecondary || '#4b5563';
                  e.currentTarget.style.backgroundColor = colors.backgroundLight || '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = colors.textLight || '#9ca3af';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                ✕
              </button>
            )}
          </div>
        )}
        
        {/* Body */}
        <div 
          style={{
            padding: '24px',
            textAlign: 'center'
          }}
        >
          <div style={{ maxWidth: '100%', margin: '0 auto' }}>
            {children}
          </div>
        </div>
      </div>

      {/* Inline styles for animation */}
      <style>{`
        @keyframes popupFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .animate-popup {
          animation: popupFadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default BlurPopup;