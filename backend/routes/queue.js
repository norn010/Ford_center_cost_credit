const express = require('express');
const { executeQuery, getQueueDatabaseName } = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  const queueDb = getQueueDatabaseName();
  if (!queueDb) {
    return res.status(500).json({ error: 'Queue database not configured' });
  }

  const { status = 'กำลังAutomate' } = req.query;

  const query = `
    SELECT
      id,
      [Brand],
      [สาขา],
      [เลขที่ใบกำกับภาษี],
      [วันที่ใบกำกับภาษี],
      [รายได้ค่าอะไหล่],
      [รายได้ค่าแรง],
      [รายได้ค่างานนอก],
      [รายได้ค่าน้ำมัน],
      [ต้นทุนอะไหล่],
      [ต้นทุนงานนอก],
      [ต้นทุนน้ำมัน],
      [รวมต้นทุน],
      [ราคาขายรวมภาษี],
      [ยอดตัดแล้ว],
      [ยอดคงเหลือ],
      [ออกใบกำกับในนาม],
      [รหัสลูกค้าที่ออกใบกำกับ],
      [automate_status],
      [หมายเหตุ],
      [created_at]
    FROM [dbo].[Automation_Queue_Center_Cost_Credit]
    WHERE
      (@status IS NULL OR automate_status = @status)
    ORDER BY [วันที่ใบกำกับภาษี] ASC, [เลขที่ใบกำกับภาษี] ASC, id ASC
  `;

  try {
    const result = await executeQuery(queueDb, query, {
      status: status || null,
    });
    return res.json(result.recordset || []);
  } catch (err) {
    console.error('Error fetching automation queue', err);
    return res.status(500).json({ error: 'Failed to fetch automation queue' });
  }
});

router.put('/:id', async (req, res) => {
  const queueDb = getQueueDatabaseName();
  if (!queueDb) {
    return res.status(500).json({ error: 'Queue database not configured' });
  }

  const { id } = req.params;
  const {
    หมายเหตุ: note,
    automate_status: status,
  } = req.body;

  const query = `
    UPDATE [dbo].[Automation_Queue_Center_Cost_Credit]
    SET
      [หมายเหตุ] = @note,
      [automate_status] = @status
    WHERE id = @id
  `;

  try {
    await executeQuery(queueDb, query, {
      id,
      note: note ?? null,
      status: status ?? null,
    });
    return res.json({ success: true });
  } catch (err) {
    console.error('Error updating automation queue row', err);
    return res.status(500).json({ error: 'Failed to update automation queue row' });
  }
});

module.exports = router;
