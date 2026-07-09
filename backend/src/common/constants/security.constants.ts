/** Custo do bcrypt para hash de senha. 12 rounds é o mínimo recomendado em 2026. */
export const BCRYPT_SALT_ROUNDS = 12;

/** Bcrypt trunca silenciosamente entradas acima de 72 bytes — limitamos antes. */
export const MAX_PASSWORD_LENGTH = 72;
