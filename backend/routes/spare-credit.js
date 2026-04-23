const express = require('express');
const router = express.Router();
const { executeQuery, getQueueDatabaseName, sql } = require('../db');

// ============================================
// API for Brand_Acc_Tb
// ============================================

// GET all
router.get('/brand-acc', async (req, res, next) => {
    try {
        const dbName = getQueueDatabaseName();
        const result = await executeQuery(dbName, 'SELECT * FROM [dbo].[Brand_Acc_Tb]');
        res.json(result.recordset);
    } catch (err) {
        next(err);
    }
});

// POST
router.post('/brand-acc', async (req, res, next) => {
    try {
        const { Brand, Branch, Shorts, Acc1, Acc2, Acc3, Acc4, Acc5, Acc6 } = req.body;
        const dbName = getQueueDatabaseName();
        await executeQuery(
            dbName,
            `INSERT INTO [dbo].[Brand_Acc_Tb] (Brand, Branch, Shorts, Acc1, Acc2, Acc3, Acc4, Acc5, Acc6) 
             VALUES (@Brand, @Branch, @Shorts, @Acc1, @Acc2, @Acc3, @Acc4, @Acc5, @Acc6)`,
            { Brand, Branch, Shorts, Acc1, Acc2, Acc3, Acc4, Acc5, Acc6 }
        );
        res.status(201).json({ message: 'Added successfully' });
    } catch (err) {
        next(err);
    }
});

// PUT (Update)
router.put('/brand-acc/:brand/:branch', async (req, res, next) => {
    try {
        const { brand: oldBrand, branch: oldBranch } = req.params;
        const { Brand, Branch, Shorts, Acc1, Acc2, Acc3, Acc4, Acc5, Acc6 } = req.body;
        const dbName = getQueueDatabaseName();
        await executeQuery(
            dbName,
            `UPDATE [dbo].[Brand_Acc_Tb] 
             SET Brand=@Brand, Branch=@Branch, Shorts=@Shorts, Acc1=@Acc1, Acc2=@Acc2, Acc3=@Acc3, Acc4=@Acc4, Acc5=@Acc5, Acc6=@Acc6
             WHERE Brand=@oldBrand AND Branch=@oldBranch`,
            { oldBrand, oldBranch, Brand, Branch, Shorts, Acc1, Acc2, Acc3, Acc4, Acc5, Acc6 }
        );
        res.json({ message: 'Updated successfully' });
    } catch (err) {
        next(err);
    }
});

// DELETE
router.delete('/brand-acc/:brand/:branch', async (req, res, next) => {
    try {
        const { brand: Brand, branch: Branch } = req.params;
        const dbName = getQueueDatabaseName();
        await executeQuery(
            dbName,
            `DELETE FROM [dbo].[Brand_Acc_Tb] WHERE Brand=@Brand AND Branch=@Branch`,
            { Brand, Branch }
        );
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        next(err);
    }
});

// ============================================
// API for Com_Ex_Tb
// ============================================

// GET all
router.get('/com-ex', async (req, res, next) => {
    try {
        const dbName = getQueueDatabaseName();
        const result = await executeQuery(dbName, 'SELECT * FROM [dbo].[Com_Ex_Tb]');
        res.json(result.recordset);
    } catch (err) {
        next(err);
    }
});

// POST
router.post('/com-ex', async (req, res, next) => {
    try {
        const { Brand, Branch, LoneCode, ExpressCode, Cusname } = req.body;
        const dbName = getQueueDatabaseName();
        await executeQuery(
            dbName,
            `INSERT INTO [dbo].[Com_Ex_Tb] (Brand, Branch, LoneCode, ExpressCode, Cusname) 
             VALUES (@Brand, @Branch, @LoneCode, @ExpressCode, @Cusname)`,
            { Brand, Branch, LoneCode, ExpressCode, Cusname }
        );
        res.status(201).json({ message: 'Added successfully' });
    } catch (err) {
        next(err);
    }
});

// PUT (Update)
router.put('/com-ex/:brand/:branch', async (req, res, next) => {
    try {
        const { brand: oldBrand, branch: oldBranch } = req.params;
        const { Brand, Branch, LoneCode, ExpressCode, Cusname } = req.body;
        const dbName = getQueueDatabaseName();
        await executeQuery(
            dbName,
            `UPDATE [dbo].[Com_Ex_Tb] 
             SET Brand=@Brand, Branch=@Branch, LoneCode=@LoneCode, ExpressCode=@ExpressCode, Cusname=@Cusname
             WHERE Brand=@oldBrand AND Branch=@oldBranch`,
            { oldBrand, oldBranch, Brand, Branch, LoneCode, ExpressCode, Cusname }
        );
        res.json({ message: 'Updated successfully' });
    } catch (err) {
        next(err);
    }
});

// DELETE
router.delete('/com-ex/:brand/:branch', async (req, res, next) => {
    try {
        const { brand: Brand, branch: Branch } = req.params;
        const dbName = getQueueDatabaseName();
        await executeQuery(
            dbName,
            `DELETE FROM [dbo].[Com_Ex_Tb] WHERE Brand=@Brand AND Branch=@Branch`,
            { Brand, Branch }
        );
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
