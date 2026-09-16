import dotenv from "dotenv";

dotenv.config();

const config = {
  port: Number(process.env.PORT || 5000),

  databaseUrl: process.env.DATABASE_URL,

  jwtSecret:
    process.env.JWT_SECRET ||
    "CHANGE_THIS_SECRET_IN_ENV",

  corsOrigin:
    process.env.CORS_ORIGIN ||
    "http://localhost:5173",

  uploadMaxMb:
    Number(process.env.UPLOAD_MAX_MB || 10240),

  ingestionBatchSize:
    Number(process.env.INGESTION_BATCH_SIZE || 5000),

  mlSampleSize:
    Number(process.env.ML_SAMPLE_SIZE || 20000),

  mlTrees:
    Number(process.env.ML_TREES || 80),

  geoIpDbPath:
    process.env.GEOIP_DB_PATH ||
    "data/geoip.csv"
};

export default config;