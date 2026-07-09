export default function CloseButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        float: "right",
        width: "24px",
        height: "24px",
        border: "none",
        borderRadius: "50%",
        background: "#ef4444",
        color: "#fff",
        fontSize: "12px",
        fontWeight: "bold",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      X
    </button>
  );
}
