import { FormalCard } from "../components/FormalCard";
export function InfoPage({ section }: { section: "proyecto" }) {
  const content = {
    proyecto: {
      eyebrow: "TEORÍA DE LA COMPUTACIÓN",
      title: "Tecnología formal para eventos reales.",
      copy: "HackaFlow nace como proyecto académico para demostrar cómo un AFD puede modelar el control de acceso de equipos durante una hackatón.",
    },
  }[section];

  return (
    <section className="info-page">
      <div className="eyebrow">
        <span /> {content.eyebrow}
      </div>
      <h1>{content.title}</h1>
      <p>{content.copy}</p>
      <FormalCard />
    </section>
  );
}
