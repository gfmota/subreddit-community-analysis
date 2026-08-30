import useIsMobile from '../hooks/useIsMobile';

const LegendCircle = ({ size, label, color }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      marginBottom: 12,
    }}
  >
    <div
      style={{
        width: size * 2,
        height: size * 2,
        borderRadius: '50%',
        background: color,
        marginRight: 12,
        flexShrink: 0,
      }}
    />
    <span>{label}</span>
  </div>
);

export default function BubbleLegend({
  label,
  scale,
  values,
  color = '#3b82f6',
}) {
  const isMobile = useIsMobile();
  return (
    <div
      style={{
        position: 'absolute',
        bottom: isMobile ? 96 : 8,
        right: 8,
        zIndex: 10,
        fontSize: 12,
        color: '#666',
        padding: 12,
        background: 'white',
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0,0,0,.15)',
      }}
    >
      <strong>{label}</strong>

      <div style={{ marginTop: 12 }}>
        {values.map((value) => (
          <LegendCircle
            key={value}
            size={scale(value)}
            label={value.toLocaleString()}
            color={color}
          />
        ))}
      </div>
    </div>
  );
}
