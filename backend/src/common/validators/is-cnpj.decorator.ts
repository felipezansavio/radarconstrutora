import { registerDecorator, ValidationOptions } from 'class-validator';

function calculateCheckDigit(digits: string, weights: number[]): number {
  const sum = digits
    .split('')
    .reduce((acc, digit, i) => acc + Number(digit) * weights[i], 0);
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

/** Valida o formato e os dígitos verificadores de um CNPJ (com ou sem máscara). */
export function isValidCnpj(value: unknown): boolean {
  if (typeof value !== 'string') return false;

  const digits = value.replace(/\D/g, '');

  if (digits.length !== 14) return false;
  // Sequências com todos os dígitos iguais passam na soma, mas são inválidas.
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const firstCheckDigit = calculateCheckDigit(
    digits.slice(0, 12),
    [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );
  const secondCheckDigit = calculateCheckDigit(
    digits.slice(0, 12) + firstCheckDigit,
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );

  return digits.slice(12) === `${firstCheckDigit}${secondCheckDigit}`;
}

export function IsCnpj(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isCnpj',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return isValidCnpj(value);
        },
        defaultMessage() {
          return `${propertyName} deve ser um CNPJ válido`;
        },
      },
    });
  };
}
