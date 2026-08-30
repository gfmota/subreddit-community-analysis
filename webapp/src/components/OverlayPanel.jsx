export default function OverlayPanel({
  children,
  top,
  bottom,
  left,
  right,
  style = {},
}) {
  return (
    <div
      style={{
        position: 'absolute',
        top,
        bottom,
        left,
        right,
        zIndex: 10,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
