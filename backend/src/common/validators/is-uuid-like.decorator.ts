import { registerDecorator, ValidationOptions } from 'class-validator';

const UUID_LIKE_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Valida o formato geral de um id (8-4-4-4-12 em hexadecimal) sem exigir
 * os nibbles de versão/variante do RFC4122 que `@IsUUID()` exige. Os dados
 * de seed da plataforma usam ids legíveis (ex.:
 * "00000000-0000-0000-0000-000000000201") que são válidos como coluna
 * `uuid` no Postgres, mas não são UUIDv4 "de verdade" — `@IsUUID()`
 * rejeitaria qualquer referência a esses registros.
 */
export function IsUuidLike(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isUuidLike',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return typeof value === 'string' && UUID_LIKE_PATTERN.test(value);
        },
        defaultMessage() {
          return `${propertyName} must be a valid id`;
        },
      },
    });
  };
}
