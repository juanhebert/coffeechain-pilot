const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = app => {
  app.use(
    createProxyMiddleware(['/api/**', '/img/**', '/uploads/**'], {
      target: 'http://localhost:8080',
    }),
  );
};
