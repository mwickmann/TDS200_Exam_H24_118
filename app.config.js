import 'dotenv/config';

export default {
  expo: {
    name: "ArtVista",
    slug: "ArtVista",
    version: "1.0.0",
    extra: {
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    },
    web: {
      build: {
        env: {
          GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
        },
      },
    },
  },
};
