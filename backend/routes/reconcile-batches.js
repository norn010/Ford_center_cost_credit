const express = require('express');
const { executeQuery, getQueueDatabaseName } = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  const queueDb = getQueueDatabaseName();
  if (!queueDb) {
    return res.status(500).json({ error: 'Queue database not configured' });
  }

  const { database } = req.query;

  const query = `
    SELECT
      id,
      Brand,
      [สาขา],
      rs_docno,
      fee,
      diff_debit,
      diff_credit,
      automate_status,
      [รหัสลูกค้า],
      [ยอดรวมสุทธิ],
      created_at
    FROM [dbo].[Debt_batch]
    WHERE
      automate_status = N'กำลังautomate'
    ORDER BY created_at DESC
  `;

  try {
    const result = await executeQuery(queueDb, query);
    return res.json(result.recordset || []);
  } catch (err) {
    console.error('Error fetching reconcile batches', err);
    return res.status(500).json({ error: 'Failed to fetch reconcile batches' });
  }
});

router.get('/:id/details', async (req, res) => {
  const queueDb = getQueueDatabaseName();
  if (!queueDb) {
    return res.status(500).json({ error: 'Queue database not configured' });
  }

  const { id } = req.params;

  const query = `
    SELECT
      id,
      batch_id,
      queue_id,
      [เลขที่ใบกำกับภาษี],
      [ราคารวมภาษี],
      created_at
    FROM [dbo].[Debt_detail]
    WHERE batch_id = @id
    ORDER BY created_at ASC
  `;

  try {
    const result = await executeQuery(queueDb, query, { id });
    return res.json(result.recordset || []);
  } catch (err) {
    console.error('Error fetching debt details', err);
    return res.status(500).json({ error: 'Failed to fetch debt details' });
  }
});

module.exports = router;

