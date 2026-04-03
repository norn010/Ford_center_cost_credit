const express = require('express');
const { sql, executeQuery, runInDatabase, getQueueDatabaseName } = require('../db');

const router = express.Router();

router.post('/', async (req, res) => {
  const { header, items } = req.body;

  if (!header || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'header and items are required' });
  }

  const queueDb = getQueueDatabaseName();
  if (!queueDb) {
    return res.status(500).json({ error: 'Queue database not configured' });
  }

  try {
    await runInDatabase(queueDb, async (baseRequest) => {
      // 1. Insert into Automation_Queue_Ford_Center_cost_Credit_Settlement
      const settlementQuery = `
        INSERT INTO [dbo].[Automation_Queue_Ford_Center_cost_Credit_Settlement] (
          [Brand], [สาขา], [รหัสลูกค้าที่ออกใบกำกับ], [ออกใบกำกับในนาม], 
          [received_amount_ex], [withholding_tax], [fee], [diff_debit], [diff_credit], 
          [remark], [rs_no], [automate_status]
        ) 
        OUTPUT INSERTED.id
        VALUES (
          @Brand, @Branch, @CustomerCode, @CustomerName, 
          @ReceivedAmount, @Wht, @Fee, @DiffDebit, @DiffCredit, 
          @Remark, @RsNo, N'กำลังautomate'
        )
      `;

      baseRequest.input('Brand', header.Brand || 'Ford');
      baseRequest.input('Branch', header.branch || null);
      baseRequest.input('CustomerCode', header.customer_code || null);
      baseRequest.input('CustomerName', header.customer_name || null);
      baseRequest.input('ReceivedAmount', header.received_amount_ex || 0);
      baseRequest.input('Wht', header.withholding_tax || 0);
      baseRequest.input('Fee', header.fee || 0);
      baseRequest.input('DiffDebit', header.diff_debit || 0);
      baseRequest.input('DiffCredit', header.diff_credit || 0);
      baseRequest.input('Remark', header.remark || null);
      baseRequest.input('RsNo', header.rs_no || null);

      const settlementResult = await baseRequest.query(settlementQuery);
      const settlementId = settlementResult.recordset[0].id;

      // 2. Insert items and update the original queue rows
      for (const item of items) {
        const itemRequest = new sql.Request(baseRequest.transaction);
        // Ensure the database context for each new request
        await itemRequest.query(`USE [${queueDb}]`);

        itemRequest.input('SettlementId', settlementId);
        itemRequest.input('QueueId', item.queue_id);
        itemRequest.input('AmountEx', item.amount_ex);
        itemRequest.input('InvoiceNo', item.invoice_no);

        // Insert Settlement Item
        const itemQuery = `
          INSERT INTO [dbo].[Automation_Queue_Ford_Center_cost_Credit_Settlement_Item] (
            [settlement_id], [queue_id], [amount_ex], [เลขที่ใบกำกับภาษี]
          ) VALUES (
            @SettlementId, @QueueId, @AmountEx, @InvoiceNo
          )
        `;
        await itemRequest.query(itemQuery);

        // Update the Automation_Queue_Center_Cost_Credit table
        // We use ISNULL to handle nulls and ensure prices are correct. 
        // We compare with a small threshold (e.g. 1.00) to allow for rounding differences if needed, but 0 is standard.
        const updateQueueQuery = `
          UPDATE [dbo].[Automation_Queue_Center_Cost_Credit]
          SET 
            [ยอดตัดแล้ว] = ISNULL([ยอดตัดแล้ว], 0) + @AmountEx,
            [ยอดคงเหลือ] = [ราคาขายรวมภาษี] - (ISNULL([ยอดตัดแล้ว], 0) + @AmountEx),
            [automate_status] = CASE 
              WHEN [ราคาขายรวมภาษี] - (ISNULL([ยอดตัดแล้ว], 0) + @AmountEx) <= 1.00 THEN N'ตัดชำระเสร็จแล้ว' 
              ELSE [automate_status]
            END
          WHERE id = @QueueId
        `;
        await itemRequest.query(updateQueueQuery);
      }
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('Error creating settlement', err);
    return res.status(500).json({ 
      error: 'Failed to create settlement', 
      message: err.message 
    });
  }
});

router.get('/', async (req, res) => {
  const queueDb = getQueueDatabaseName();
  if (!queueDb) {
    return res.status(500).json({ error: 'Queue database not configured' });
  }

  const query = `
    SELECT * 
    FROM [dbo].[Automation_Queue_Ford_Center_cost_Credit_Settlement]
    ORDER BY created_at DESC
  `;

  try {
    const result = await executeQuery(queueDb, query);
    return res.json(result.recordset || []);
  } catch (err) {
    console.error('Error fetching settlements', err);
    return res.status(500).json({ error: 'Failed to fetch settlements' });
  }
});

router.get('/:id/items', async (req, res) => {
  const queueDb = getQueueDatabaseName();
  if (!queueDb) {
    return res.status(500).json({ error: 'Queue database not configured' });
  }

  const { id } = req.params;
  const query = `
    SELECT * 
    FROM [dbo].[Automation_Queue_Ford_Center_cost_Credit_Settlement_Item]
    WHERE settlement_id = @id
  `;

  try {
    const result = await executeQuery(queueDb, query, { id });
    return res.json(result.recordset || []);
  } catch (err) {
    console.error('Error fetching settlement items', err);
    return res.status(500).json({ error: 'Failed to fetch settlement items' });
  }
});

module.exports = router;
