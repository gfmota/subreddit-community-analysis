import { useEffect, useState } from 'react';

export default function BottomModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) setVisible(true);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
    } else {
      const t = setTimeout(() => setVisible(false), 300); // match transition duration
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!isOpen && !visible) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 100,
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.25s ease',
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'white',
          borderRadius: '16px 16px 0 0',
          zIndex: 101,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s ease',
        }}
      >
        {/* Header */}
        {title && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 16,
              borderBottom: '1px solid #eee',
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 'bold' }}>{title}</span>
            <button
              onClick={onClose}
              style={{
                border: 'none',
                background: 'none',
                fontSize: 20,
                cursor: 'pointer',
                color: '#888',
                padding: '0 4px',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        )}

        <div style={{ overflowY: 'auto', flex: 1, padding: 16 }}>
          {children}
        </div>
      </div>
    </>
  );
}
