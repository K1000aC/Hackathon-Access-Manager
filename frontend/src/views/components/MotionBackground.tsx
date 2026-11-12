export function MotionBackground() {
  return (
    <div className="motion-background" aria-hidden="true">
      <div className="ambient-glow glow-one" />
      <div className="ambient-glow glow-two" />
      <div className="ambient-grid" />
      {Array.from({ length: 12 }, (_, i) => (
        <span
          className="ambient-particle"
          key={i}
          style={{
            left: `${(i * 17 + 5) % 100}%`,
            top: `${(i * 23 + 8) % 100}%`,
            animationDelay: `${-i * 1.7}s`,
            animationDuration: `${14 + (i % 5) * 3}s`,
          }}
        />
      ))}
      <div className="ambient-scan" />
    </div>
  );
}
