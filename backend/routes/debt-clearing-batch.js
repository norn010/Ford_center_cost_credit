const express = require('express');
const { getQueueDatabaseName, runInDatabase } = require('../db');

const router = express.Router();

router.post('/', async (req, res) => {
  const queueDb = getQueueDatabaseName();
  if (!queueDb) {
    return res.status(500).json({ error: 'Queue database not configured' });
  }

  const {
    database_name,
    branch,
    รหัสลูกค้า: customerCode,
    bank_account,
    bank_account_name,
    ar_account,
    ar_account_name,
    fee_account,
    fee_account_name,
    diff_account,
    diff_account_name,
    rs_docno,
    fee,
    diff_debit,
    diff_credit,
    bank_statement,
    rows: rowsPayload,
  } = req.body;

  if (!database_name || !rs_docno || !Array.isArray(rowsPayload) || rowsPayload.length === 0) {
    return res.status(400).json({
      error: 'Missing required fields: database_name, rs_docno, and non-empty rows array',
    });
  }

  const totalNetAmount = rowsPayload.reduce(
    (sum, r) => sum + (r.amount != null ? Number(r.amount) : 0),
    0,
  );

  const insertBatchQuery = `
    INSERT INTO [dbo].[Debt_batch] (
      [Brand],
      [สาขา],
      [rs_docno],
      [fee],
      [diff_debit],
      [diff_credit],
      [automate_status],
      [รหัสลูกค้า],
      [ยอดรวมสุทธิ]
    )
    OUTPUT INSERTED.id
    VALUES (
      @Brand,
      @branch,
      @rs_docno,
      @fee,
      @diff_debit,
      @diff_credit,
      N'กำลังautomate',
      @customerCode,
      @totalNetAmount
    )
  `;

  try {
    const firstRow = rowsPayload[0];
    await runInDatabase(queueDb, async (request) => {
      request.input('Brand', firstRow.Brand || 'Ford');
      request.input('branch', branch ?? null);
      request.input('rs_docno', rs_docno);
      request.input('fee', fee != null ? Number(fee) : 0);
      request.input('diff_debit', diff_debit != null ? Number(diff_debit) : 0);
      request.input('diff_credit', diff_credit != null ? Number(diff_credit) : 0);
      request.input('customerCode', customerCode ?? null);
      request.input('totalNetAmount', totalNetAmount);

      const batchResult = await request.query(insertBatchQuery);
      const batchId = batchResult.recordset[0].id;

      const values = rowsPayload.map(
        (r, i) =>
          `(@batch_id, @queue_id_${i}, @invoice_no_${i}, @amount_${i})`,
      );
      request.input('batch_id', batchId);
      rowsPayload.forEach((r, i) => {
        request.input(`queue_id_${i}`, r.id);
        request.input(`invoice_no_${i}`, r.invoice_no ?? null);
        request.input(`amount_${i}`, r.amount != null ? Number(r.amount) : null);
      });
      await request.query(`
        INSERT INTO [dbo].[Debt_detail] (batch_id, queue_id, [เลขที่ใบกำกับภาษี], [ราคารวมภาษี])
        VALUES ${values.join(', ')}
      `);

      const ids = rowsPayload.map((r) => r.id).filter((id) => id != null);
      if (ids.length > 0) {
        const idList = ids.join(',');
        await request.query(`
          UPDATE [dbo].[Automation_Queue_Spare_Credit]
          SET automate_status = N'Automateตัดชำระ'
          WHERE id IN (${idList})
        `);
      }
    });
    return res.json({ success: true });
  } catch (err) {
    console.error('Error creating debt clearing batch', err);
    const detail = err.original?.info?.message || err.message;
    return res.status(500).json({
      error: 'Failed to create debt clearing batch',
      detail: process.env.NODE_ENV !== 'production' ? detail : undefined,
    });
  }
});

module.exports = router;
