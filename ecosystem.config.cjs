module.exports = {
  apps: [
    {
      name: "lima-waktu",
      script: "build/index.js",
      env: {
        TZ: "Asia/Makassar",
        NODE_ENV: "production",
      },
    },
  ],
};