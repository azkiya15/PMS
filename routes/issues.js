var express = require('express');
const moment = require('moment');
var router = express.Router();
const checkAuth = require('../middlewares/check-auth');

const sqlShared = `FROM issues`;

function getConditional(projectid, issueid) {
    let conditional = `WHERE projectid = ${projectid}`;
    if (issueid) {
      conditional += ` AND issueid = ${issueid}`;
    }
    return conditional;
  }

// /**
//  * @param {import("pg").Pool} pool
//  * @returns {import("express").Router}
//  */
module.exports = pool => {
  router.get('/:projectid', checkAuth, async (req, res, next) => {
    const { projectid } = req.params;
    const {
      ckid,
      issueid,
      cktracker,
      tracker,
      cksubject,
      subject,
      ckstatus,
      status,
      ckpriority,
      priority,
      ckdone,
      done,
    } = req.query;

    let conditional = getConditional(projectid);
    const conditionals = [];

    if (ckid && issueid) {
      conditionals.push(`issueid = ${issueid}`);
    }
    if (cktracker && tracker) {
      conditionals.push(`tracker = '${tracker}'`);
    }
    if (cksubject && subject) {
      conditionals.push(`subject ILIKE '%${subject}%'`);
    }
    if (ckstatus && status) {
      conditionals.push(`status = '${status}'`);
    }
    if (ckpriority && priority) {
      conditionals.push(`priority = '${priority}'`);
    }
    if (ckdone && done) {
      conditionals.push(`done = ${done}`);
    }

    if (conditionals.length > 0) {
      conditional += ` AND ${conditionals.join(" AND ")}`;
    }

    const sqlSelect = `SELECT issueid, projectid, tracker, 
    subject, status, priority, 
    startdate, duedate, targetversion, 
    crateddate, updateddate, closeddate, 
    estimatedtime, done, spenttime`;

    const countTotal = `SELECT COUNT(issueid) total ${sqlShared} ${conditional}`;

    const url = req.originalUrl.includes("page=")
      ? req.originalUrl
      : `${req.originalUrl}?page=1`;

    const page = req.query.page || 1; // nilai awal page
    const limit = 3; // batas data yang di tampilkan
    const offset = (page - 1) * limit;

    const sqlIssues = `${sqlSelect} ${sqlShared} ${conditional} LIMIT ${limit} OFFSET ${offset}`;

    try {
      const { rows } = await pool.query(sqlIssues);
      const { rows: countTotalResults } = await pool.query(countTotal);

      let projectName = "";
      let total = 0;

      if (rows.length > 0) {
        projectName = rows[0].projectname;
        total = parseInt(countTotalResults[0].total);
      }

      const totalPage = Math.ceil(total / limit);

      const title = `Members of ${projectName}`;

      console.log("CEK ROWS", rows);

      const data = rows.map((item) => ({
        ...item,
        startdate: item.startdate ? moment(item.startdate).format('D/MM/YYYY') : "-",
        duedate: item.duedate ? moment(item.duedate).format('D/MM/YYYY') : "-",
        crateddate: moment(item.crateddate).format('D/MM/YYYY'),
        updateddate: moment(item.updateddate).format('D/MM/YYYY'),
        closeddate: item.closeddate ? moment(item.closeddate).format('D/MM/YYYY') : "-",
      }))

      res.render("issues/issues", {
        title,
        url,
        current: page,
        data,
        title,
        totalPage,
        id: projectid,
        ckid: ckid || "",
        issueid: issueid || "",
        cktracker: cktracker || "",
        tracker: tracker || "",
        cksubject: cksubject || "",
        subject: subject || "",
        ckstatus: ckstatus || "",
        status: status || "",
        ckpriority: ckpriority || "",
        priority: priority || "",
        ckdone: ckdone || "",
        done: done || ""
      });
    } catch (error) {
      console.log(error);
      next(error);
    }

  });

  router.get(
    '/:projectid/edit/:memberid',
    checkAuth,
    async (req, res, next) => {},
  );

  router.post(
    '/:projectid/submitedit/:id',
    checkAuth,
    (req, res, next) => {},
  );

  router.get('/:projectid/delete/:id', checkAuth, (req, res) => {});

  router.get(
    '/:projectid/add',
    checkAuth,
    function (req, res, next) {},
  );

  router.post(
    '/:projectid/add',
    checkAuth,
    async (req, res, next) => {},
  );

  return router;
};
