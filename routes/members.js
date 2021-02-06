var express = require("express");
var router = express.Router();
const checkAuth = require("../middlewares/check-auth");

const sqlShared = `FROM members m INNER JOIN users u ON m.userid = u.userid
INNER JOIN projects p ON p.projectid = m.projectid`;

function getConditional(projectid, memberid) {
  let conditional = `WHERE m.projectid = ${projectid}`;
  if (memberid) {
    conditional += ` AND m.id = ${memberid}`;
  }
  return conditional;
}

const sqlSelect = `SELECT m.id, m.role, CONCAT(u.firstname, ' ', u.lastname) AS fullname, 
p.name AS projectname`;

/**
 * @param {import("pg").Pool} pool
 * @returns {import("express").Router}
 */
module.exports = (pool) => {
  /* GET home page. */
  // router.get('/', function(req, res, next) {
  //   res.render('members/list', { title: 'Express' });
  // });

  // router.get('/edit', function(req, res, next) {
  //     res.render('members/edit', { title: 'Express' });
  //  });

  // router.get('/add', function(req, res, next) {
  //    res.render('members/add', { title: 'Express' });
  // });

  router.get("/:projectid", checkAuth, async (req, res, next) => {
    const { projectid } = req.params;
    console.log("CEK ", projectid);
    const { ckid, id, ckname, name, ckposition, position } = req.query;

    let conditional = getConditional(projectid);
    const conditionals = [];

    if (ckid && id) {
      conditionals.push(`m.id = ${id}`);
    }
    if (ckname && name) {
      conditionals.push(`fullname ILIKE '%${name}%'`);
    }
    if (ckposition && position) {
      conditionals.push(`m.role = '${position}'`);
    }

    if (conditionals.length > 0) {
      conditional += ` AND ${conditionals.join(" AND ")}`;
    }

    const countTotal = `SELECT COUNT(m.id) total ${sqlShared} ${conditional}`;

    const url = req.originalUrl.includes("page=")
      ? req.originalUrl
      : `${req.originalUrl}?page=1`;

    const page = req.query.page || 1; // nilai awal page
    const limit = 3; // batas data yang di tampilkan
    const offset = (page - 1) * limit;

    const sqlMembers = `${sqlSelect} ${sqlShared} ${conditional} LIMIT ${limit} OFFSET ${offset}`;

    try {
      const { rows } = await pool.query(sqlMembers);
      const { rows: countTotalResults } = await pool.query(countTotal);

      let projectName = "";
      let total = 0;

      if (rows.length > 0) {
        projectName = rows[0].projectname;
        total = parseInt(countTotalResults[0].total);
      }

      const totalPage = Math.ceil(total / limit);

      const title = `Members of ${projectName}`;

      res.render("members/list", {
        title,
        current: page,
        url,
        model: rows,
        title,
        totalPage,
        id: projectid,
        ckid: ckid || "",
        memberid: id || "",
        ckname: ckname || "",
        name: name || "",
        ckposition: ckposition || "",
        position: position || "",
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  });

  router.get(
    "/:projectid/edit/:memberid",
    checkAuth,
    async (req, res, next) => {
      const { projectid, memberid } = req.params;

      const conditional = getConditional(projectid, memberid);

      const sqlMembers = `${sqlSelect} ${sqlShared} ${conditional}`;

      try {
        const { rows } = await pool.query(sqlMembers);
        if (rows.length === 0) {
          res.redirect(req.originalUrl.replace(/\/edit.*$/, ""));
          return;
        }
        res.render("members/edit", {
          data: rows[0],
          title: `Edit member of ${rows[0].projectname}`,
          projectid
        });
      } catch (error) {
        next(error);
      }
    }
  );

  router.post("/:projectid/submitedit/:id", checkAuth, (req, res, next) => {
    const { id, projectid } = req.params;
    const { position } = req.body;

    let sql = `UPDATE members SET role ='${position}' WHERE id =${id}`;
    console.log(sql);

    pool.query(sql, (err) => {
      if (err) {
        next(err)
        return;
      }
      res.redirect(`/projects/members/${projectid}`);
    });
  });

  router.get("/:projectid/delete/:id", checkAuth, (req, res) => {
    const { projectid, id } = req.params;
    const sql = `DELETE FROM members WHERE id = ${id}`;

    pool.query(sql, [], (err) => {
      res.redirect(`/projects/members/${projectid}`);
    });
  });

  router.get("/:projectid/add", checkAuth, function (req, res, next) {
    const { projectid } = req.params;
    let sql = `SELECT users.userid, users.firstname, users.lastname
    FROM users  
      WHERE userid 
      NOT IN(SELECT userid FROM members WHERE projectid = $1)`;
 
    pool.query(sql, [projectid], (err, result) => {
      console.log(result.rows);
      res.render("members/add", {
        projectid,
        title: `Add member`,
        data: result.rows,
      });
    });
  });

  router.post("/:projectid/add", checkAuth, async (req, res, next) => {
    const { projectid } = req.params;
    const { member, position } = req.body;

    const sqlAdd = `INSERT INTO members (role, userid, projectid)
    VALUES ($1, $2, $3)`;

    try {
      await pool.query(sqlAdd, [position, member, projectid]);

      res.redirect(`/projects/members/${projectid}`);
    } catch (error) {
      next (error)
    }
  })

  return router;
};
