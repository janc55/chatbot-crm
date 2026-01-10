// src/utils/normalizeTitle.ts

export function toCommandSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// Ejemplos de uso:
// normalizeForCommand("¡Hola! ¿Cómo estás?")   → "holacomoestas"
// normalizeForCommand("Pregunta por Precios")  → "preguntaporprecios"
// normalizeForCommand("Saludo Inicial 2025")   → "saludoinicial2025"