import { randomInt } from "node:crypto";
const firstNames = [
  "Valeria",
  "Diego",
  "Mariana",
  "Andrés",
  "Sofía",
  "Mateo",
  "Renata",
  "Emiliano",
  "Daniela",
  "Santiago",
  "Lucía",
  "Alejandro",
  "Paola",
  "Sebastián",
  "Fernanda",
  "Gabriel",
  "Natalia",
  "Rodrigo",
  "Elena",
  "Leonardo",
];
const surnames = [
  "Mendoza",
  "Ríos",
  "Vargas",
  "Navarro",
  "Salazar",
  "Ortega",
  "Medina",
  "Cabrera",
  "Delgado",
  "Aguilar",
  "Romero",
  "Paredes",
  "Fuentes",
  "Campos",
  "Herrera",
  "Vega",
  "Castillo",
  "Torres",
  "Morales",
  "Cortés",
];
export function planIdentities(count = 15, excluded = new Set()) {
  const available = firstNames
    .flatMap((first) => surnames.map((last) => ({ first, last })))
    .filter(
      ({ first, last }) =>
        !excluded.has(
          `${first}.${last}`
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase() + "@example.com",
        ),
    );
  if (available.length < count)
    throw new Error("No hay suficientes identidades ficticias disponibles.");
  return Array.from({ length: count }, () => {
    const [{ first, last }] = available.splice(randomInt(available.length), 1);
    const slug = `${first}.${last}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    return { display_name: `${first} ${last} QA`, email: `${slug}@example.com` };
  });
}
