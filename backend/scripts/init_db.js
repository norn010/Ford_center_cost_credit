const sql = require('mssql');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const config = {
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'master', // Start with master to create the new DB
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
  },
};

async function initDB() {
  let pool;
  try {
    console.log('Connecting to SQL Server...');
    pool = await sql.connect(config);
    console.log('Connected!');

    const dbName = 'Ford_center_cost_credit';
    const tableName = 'Automation_Queue_Center_Cost_Credit';

    // 1. Create Database if not exists
    console.log(`Checking database: ${dbName}...`);
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = '${dbName}')
      BEGIN
        CREATE DATABASE [${dbName}];
        PRINT 'Database created.';
      END
      ELSE
      BEGIN
        PRINT 'Database already exists.';
      END
    `);

    // 2. Create Tables
    console.log(`Creating tables in ${dbName}...`);
    await pool.request().query(`
      USE [${dbName}];

      -- Automation Queue Table
      IF OBJECT_ID('${tableName}', 'U') IS NOT NULL
      BEGIN
        DROP TABLE [${tableName}];
        PRINT 'Old queue table dropped.';
      END

      CREATE TABLE [${tableName}] (
        [id]                          INT IDENTITY(1,1) PRIMARY KEY,
        [Brand]                       NVARCHAR(50),
        [สาขา]                        NVARCHAR(255),
        [เลขที่ใบกำกับภาษี]            NVARCHAR(255),
        [วันที่ใบกำกับภาษี]            DATETIME,
        [รายได้ค่าอะไหล่]              DECIMAL(18, 2),
        [รายได้ค่าแรง]                 DECIMAL(18, 2),
        [รายได้ค่างานนอก]              DECIMAL(18, 2),
        [รายได้ค่าน้ำมัน]              DECIMAL(18, 2),
        [ต้นทุนอะไหล่]                 DECIMAL(18, 2),
        [ต้นทุนงานนอก]                DECIMAL(18, 2),
        [ต้นทุนน้ำมัน]                 DECIMAL(18, 2),
        [รวมต้นทุน]                   DECIMAL(18, 2),
        [ราคาขายรวมภาษี]              DECIMAL(18, 2),
        [ยอดตัดแล้ว]                   DECIMAL(18, 2),
        [ยอดคงเหลือ]                   DECIMAL(18, 2),
        [ออกใบกำกับในนาม]             NVARCHAR(MAX),
        [รหัสลูกค้าที่ออกใบกำกับ]      NVARCHAR(255),
        [automate_status]             NVARCHAR(100),
        [หมายเหตุ]                    NVARCHAR(MAX),
        [created_at]                  DATETIME DEFAULT GETDATE()
      );

      -- Settlement Extension Table (Header)
      IF OBJECT_ID('Automation_Queue_Ford_Center_cost_Credit_Settlement', 'U') IS NOT NULL 
        DROP TABLE [Automation_Queue_Ford_Center_cost_Credit_Settlement];
      CREATE TABLE [Automation_Queue_Ford_Center_cost_Credit_Settlement] (
        [id]                          INT IDENTITY(1,1) PRIMARY KEY,
        [Brand]                       NVARCHAR(50),
        [สาขา]                        NVARCHAR(255),
        [รหัสลูกค้าที่ออกใบกำกับ]      NVARCHAR(255),
        [ออกใบกำกับในนาม]             NVARCHAR(MAX),
        [received_amount_ex]          DECIMAL(18, 2),
        [withholding_tax]             DECIMAL(18, 2),
        [fee]                         DECIMAL(18, 2),
        [diff_debit]                  DECIMAL(18, 2),
        [diff_credit]                 DECIMAL(18, 2),
        [remark]                      NVARCHAR(MAX),
        [created_at]                  DATETIME DEFAULT GETDATE(),
        [rs_no]                       NVARCHAR(255),
        [automate_status]             NVARCHAR(100) DEFAULT N'กำลังautomate'
      );

      -- Settlement Items Table
      IF OBJECT_ID('Automation_Queue_Ford_Center_cost_Credit_Settlement_Item', 'U') IS NOT NULL 
        DROP TABLE [Automation_Queue_Ford_Center_cost_Credit_Settlement_Item];
      CREATE TABLE [Automation_Queue_Ford_Center_cost_Credit_Settlement_Item] (
        [id]                    INT IDENTITY(1,1) PRIMARY KEY,
        [settlement_id]         INT,
        [queue_id]              INT,
        [amount_ex]             DECIMAL(18, 2),
        [created_at]            DATETIME DEFAULT GETDATE(),
        [เลขที่ใบกำกับภาษี]      NVARCHAR(255)
      );

      PRINT 'All tables created successfully.';
    `);

    console.log('Database initialization completed successfully!');
  } catch (err) {
    console.error('Database initialization failed:', err);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

initDB();
