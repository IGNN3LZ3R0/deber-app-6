export interface Ejercicio {
  nombre: string;
  series: number;
  repeticiones: string; // Puede ser "12", "10-12", "30 seg"
  descanso: string; // "60 seg", "90 seg"
  video_url?: string;
  notas?: string;
}