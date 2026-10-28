export const REGLAS_PASSWORD = 'Mínimo 8 caracteres, al menos una mayúscula y un número.';

export function validarPassword(password: string): string {
  if (password.length < 8 || !password.split('').some((caracter) => /\p{Uppercase}/u.test(caracter)) ||
      !password.split('').some((caracter) => /\p{Nd}/u.test(caracter))) {
    return REGLAS_PASSWORD;
  }
  return '';
}
