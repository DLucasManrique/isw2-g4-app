export type Usuario = {
  id: number;
  username: string;
  nombreCompleto: string;
  rol: string;
  activo: boolean;
};

export type UsuarioRequest = {
  username: string;
  password: string;
  nombreCompleto: string;
  rol: string;
  activo: boolean;
};