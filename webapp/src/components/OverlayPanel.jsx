export default function OverlayPanel({
  children,
  top,
  bottom,
  left,
  right,
  withBackground,
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
        ...(withBackground
          ? {
              background: 'white',
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,.15)',
            }
          : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
}
