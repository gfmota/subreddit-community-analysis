export default function Button({ onClick, children, style }) {
  return (
    <button
      style={{
        width: 'calc(100% - 16px)',
        margin: '8px',
        padding: '12px 18px',
        border: 'none',
        borderRadius: '10px',
        background: '#3b82f6',
        color: '#fff',
        fontSize: '15px',
        fontWeight: 600,
        cursor: 'pointer',
        ...style,
      }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
