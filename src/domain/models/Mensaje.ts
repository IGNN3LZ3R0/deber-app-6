export interface Mensaje {
  id: string;
  contenido: string;
  emisor_id: string;
  receptor_id: string;
  leido: boolean;
  created_at: string;
  // Datos relacionados
  emisor?: {
    email: string;
    nombre?: string;
    rol: string;
  };
}