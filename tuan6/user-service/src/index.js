const app = require('./app');

const PORT = process.env.PORT || 8081;
const SERVICE_IP = process.env.SERVICE_IP || '0.0.0.0';

app.listen(PORT, SERVICE_IP, () => {
  console.log(`User Service running at http://${SERVICE_IP}:${PORT}`);
});
