export function toCommandSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')                     // Separa acentos (á → a + ´)
    .replace(/[\u0300-\u036f]/g, '')      // Elimina los diacríticos (´)
    .replace(/[^a-z0-9\s-]/g, '')         // Solo letras, números, espacios y guiones
    .trim()                               // Quita espacios al inicio/final
    .replace(/\s+/g, '-');                // Reemplaza uno o más espacios por un guión
}