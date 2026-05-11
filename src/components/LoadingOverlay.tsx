import React from 'react';

type LoadingOverlayProps = {
  loading: boolean;
};

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ loading }) => {
  if (!loading) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#fff',
        fontSize: '1.5rem',
        zIndex: 9999,
      }}
    >
      Loading...
    </div>
  );
};

export default LoadingOverlay;
