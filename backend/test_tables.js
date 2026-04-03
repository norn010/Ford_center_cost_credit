const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.DB_SERVER || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'Ford_center_cost_credit',
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

async function test() {
  try {
    const pool = await sql.connect(config);
    const res = await pool.request().query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES");
    console.log(res.recordset);
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
test();
