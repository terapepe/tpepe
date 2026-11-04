export default function Logo({ size = 36, variant = "main" }: { size?: number; variant?: "main" | "lab" }) {
  return (
    <img
      src={variant === "lab" ? "/logo-lab.png" : "/logo.png"}
      width={size}
      height={size}
      alt="TeraPepe"
      style={{ borderRadius: "50%", display: "block" }}
    />
  );
}
