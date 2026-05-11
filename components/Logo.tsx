export default function Logo() {
  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        border: "2px solid #111827",
        borderRadius: "3px",
        padding: "5px 7px",
        lineHeight: 1.1,
        userSelect: "none",
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", color: "#111827" }}>ESL</span>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", color: "#111827" }}>LAB</span>
    </div>
  );
}
