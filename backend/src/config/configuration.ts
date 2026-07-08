export default () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3001', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',

  database: {
    url: process.env.DATABASE_URL,
  },

  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    accessTokenTtl: process.env.JWT_ACCESS_TOKEN_TTL ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshTokenTtl: process.env.JWT_REFRESH_TOKEN_TTL ?? '7d',
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
  },

  maps: {
    provider: process.env.MAPS_PROVIDER ?? 'mapbox',
    mapboxAccessToken: process.env.MAPBOX_ACCESS_TOKEN,
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
  },

  ingestion: {
    googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY,
    newsApiKey: process.env.NEWS_API_KEY,
    realEstatePortalApiKey: process.env.REAL_ESTATE_PORTAL_API_KEY,
    realEstatePortalBaseUrl: process.env.REAL_ESTATE_PORTAL_BASE_URL,
  },

  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
  },
});
