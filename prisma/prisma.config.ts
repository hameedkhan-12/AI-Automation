export const prismaConfig = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/postgres',
    },
  },
}

export default prismaConfig
