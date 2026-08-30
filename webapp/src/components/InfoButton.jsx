export default function InfoButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        border: 0,
        boxShadow: '0 4px 12px rgba(0,0,0,.15)',
        background: 'white',
        cursor: 'pointer',
        fontSize: 24,
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      i
    </button>
  );
}
