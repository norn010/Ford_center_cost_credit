const express = require('express');
const { sql, runInDatabase, getQueueDatabaseName } = require('../db');

const router = express.Router();

router.post('/', async (req, res) => {
  const { database, rows } = req.body;

  if (!database || !Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'database and rows are required' });
  }

  const queueDb = getQueueDatabaseName();
  if (!queueDb) {
    return res.status(500).json({ error: 'Queue database not configured' });
  }

  try {
    await runInDatabase(queueDb, async (request) => {
      const table = new sql.Table('Automation_Queue_Center_Cost_Credit');
      table.create = false;

      table.columns.add('Brand',                    sql.NVarChar(50),    { nullable: true });
      table.columns.add('สาขา',                     sql.NVarChar(255),   { nullable: true });
      table.columns.add('เลขที่ใบกำกับภาษี',         sql.NVarChar(255),   { nullable: true });
      table.columns.add('วันที่ใบกำกับภาษี',         sql.DateTime,        { nullable: true });
      table.columns.add('รายได้ค่าอะไหล่',           sql.Decimal(18, 2),  { nullable: true });
      table.columns.add('รายได้ค่าแรง',              sql.Decimal(18, 2),  { nullable: true });
      table.columns.add('รายได้ค่างานนอก',           sql.Decimal(18, 2),  { nullable: true });
      table.columns.add('รายได้ค่าน้ำมัน',           sql.Decimal(18, 2),  { nullable: true });
      table.columns.add('ต้นทุนอะไหล่',              sql.Decimal(18, 2),  { nullable: true });
      table.columns.add('ต้นทุนงานนอก',             sql.Decimal(18, 2),  { nullable: true });
      table.columns.add('ต้นทุนน้ำมัน',              sql.Decimal(18, 2),  { nullable: true });
      table.columns.add('รวมต้นทุน',                sql.Decimal(18, 2),  { nullable: true });
      table.columns.add('ราคาขายรวมภาษี',          sql.Decimal(18, 2),  { nullable: true });
      table.columns.add('ยอดตัดแล้ว',               sql.Decimal(18, 2),  { nullable: true });
      table.columns.add('ยอดคงเหลือ',               sql.Decimal(18, 2),  { nullable: true });
      table.columns.add('ออกใบกำกับในนาม',          sql.NVarChar(sql.MAX), { nullable: true });
      table.columns.add('รหัสลูกค้าที่ออกใบกำกับ',   sql.NVarChar(255),   { nullable: true });
      table.columns.add('automate_status',           sql.NVarChar(100),   { nullable: true });
      table.columns.add('หมายเหตุ',                 sql.NVarChar(sql.MAX), { nullable: true });

      rows.forEach((row) => {
        table.rows.add(
          row['Brand'] || 'Ford',
          row['สาขา']                           || null,
          row['เลขที่ใบกำกับภาษี']               || null,
          row['วันที่ใบกำกับภาษี'] ? new Date(row['วันที่ใบกำกับภาษี']) : null,
          row['รายได้ค่าอะไหล่']  != null ? Number(row['รายได้ค่าอะไหล่'])  : 0,
          row['รายได้ค่าแรง']     != null ? Number(row['รายได้ค่าแรง'])     : 0,
          row['รายได้ค่างานนอก']  != null ? Number(row['รายได้ค่างานนอก'])  : 0,
          row['รายได้ค่าน้ำมัน']  != null ? Number(row['รายได้ค่าน้ำมัน'])  : 0,
          row['ต้นทุนอะไหล่']     != null ? Number(row['ต้นทุนอะไหล่'])     : 0,
          row['ต้นทุนงานนอก']    != null ? Number(row['ต้นทุนงานนอก'])    : 0,
          row['ต้นทุนน้ำมัน']     != null ? Number(row['ต้นทุนน้ำมัน'])     : 0,
          row['รวมต้นทุน']       != null ? Number(row['รวมต้นทุน'])       : 0,
          row['ราคาขายรวมภาษี']  != null ? Number(row['ราคาขายรวมภาษี'])  : 0,
          row['ยอดตัดแล้ว']      != null ? Number(row['ยอดตัดแล้ว'])      : 0,
          row['ยอดคงเหลือ']      != null ? Number(row['ยอดคงเหลือ'])      : 0,
          row['ออกใบกำกับในนาม']          || null,
          row['รหัสลูกค้าที่ออกใบกำกับ']   || null,
          'กำลังAutomate',
          null, // หมายเหตุ
        );
      });

      await request.bulk(table);
    });

    return res.json({ success: true, inserted: rows.length });
  } catch (err) {
    console.error('Error inserting into Automation_Queue_Center_Cost_Credit', err);
    const message =
      process.env.NODE_ENV === 'development' ? err.message : 'Failed to queue automation';
    return res.status(500).json({ error: 'Failed to send records to automation queue.', detail: message });
  }
});

module.exports = router;
