export interface Usuario {
  id: string;
  email: string;
  nombre?: string;
  rol: "entrenador" | "usuario";
  created_at?: string;
}