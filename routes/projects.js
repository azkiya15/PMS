var express = require("express");
var router = express.Router();
const checkAuth = require("../middlewares/check-auth");

const sqlpart = `FROM users u INNER JOIN members m ON m.userid = u.userid
INNER JOIN projects p ON p.projectid = m.projectid`;

function getProjects(pool) {
  return (req, res) => {
    console.log(res.locals);

    const { checks } = res.locals;

    //==========FILTER===============
    const { ckid, id, ckname, name, ckfirstname, firstname } = req.query;
    let params = [];

    if (ckid && id) {
      params.push(`members.id = ${id}`);
    }
    if (ckname && name) {
      params.push(`projects.name ILIKE '%${name}%'`);
    }
    if (ckfirstname && firstname) {
      params.push(
        `CONCAT (users.firstname,' ',users.lastname) ILIKE '%${firstname}%'`
      );
    }

    //=========PAGINATION===========
    let stat = false;

    let url = req.url == "/" ? `/?page=1` : req.url;
    let page = req.query.page || 1; // nilai awal page
    let limit = 3; // batas data yang di tampilkan
    let pages = (page - 1) * limit;

    let sql = `SELECT count(*) as total from members`;

    pool.query(sql, [], (err, count) => {
      let rows = count.rows[0].total; //jumlah data dalam table
      console.log("TOTAL ", rows);
      let totalPage = Math.ceil(rows / limit); // mencari jumlah data

      sql = `select members.id, projects.name, users.firstname
      from members, projects, users
      where projects.projectid = members.projectid
      and members.userid = users.userid`;

      if (params.length > 0) {
        sql += ` AND ${params.join(" AND ")}`;
      }

      if (stat == true) {
        sql += ` AND ${joindata} `;
      }

      sql += ` LIMIT ${limit} OFFSET ${pages}`;
      console.log("SQL", sql);
      pool.query(sql, [], (err, row) => {
        console.log(row.rows);
        res.render("projects/index", {
          model: row.rows,
          pages: totalPage,
          current: page,
          query: req.query,
          url,
          checks,
        });
      });
    });
  };
}

const concatName = `CONCAT(u.firstname, ' ', u.lastname)`;
const memberAgg = `STRING_AGG(${concatName}, ', ' ORDER BY u.firstname)`;

module.exports = (pool) => {
  router.get("/", checkAuth, function (req, res, next) {
    //==========FILTER===============
    const { ckid, id, ckname, name, ckfirstname, firstname } = req.query;
    let params = [];

    if (ckid && id) {
      params.push(`p.projectid = ${id}`);
    }
    if (ckname && name) {
      params.push(`p.name ILIKE '%${name}%'`);
    }
    if (ckfirstname && firstname) {
      params.push(`${concatName} ILIKE '%${firstname}%'`);
    }

    //=========PAGINATION===========
    let stat = false;

    let url = req.url == "/" ? `/?page=1` : req.url;
    let page = req.query.page || 1; // nilai awal page
    let limit = 3; // batas data yang di tampilkan
    let pages = (page - 1) * limit;

    let conditional = "";

    if (params.length > 0) {
      conditional = `WHERE ${params.join(" AND ")}`;
    }

   

    let sql = `SELECT count(DISTINCT p.projectid) as total ${sqlpart} ${conditional}`;


    console.log("CEK SQL ", sql);
    pool.query(sql, [], (err, count) => {
      console.log("CEK COUNT ", count, err);
      let rows = count.rows[0].total; //jumlah data dalam table
      console.log("TOTAL ", rows);
      let totalPage = Math.ceil(rows / limit); // mencari jumlah data

      sql = `SELECT p.projectid AS p_id, p.name, 
      ${memberAgg} AS members
      ${sqlpart} ${conditional}`;

      sql += `GROUP BY p_id ORDER BY p_id LIMIT ${limit} OFFSET ${pages}`;
      console.log("SQL", sql);
      pool.query(sql, [], (err, row) => {
        console.log(row.rows);
        res.render("projects/index", {
          title: `Projects`,
          model: row.rows,
          pages: totalPage,
          current: page,
          query: req.query,
          url,
          checks: [],
        });
      });
    });
  });

  router.post(
    "/",
    (req, res, next) => {
      const { idChecked, nameChecked, memberChecked } = req.body;
      const checks = [];

      if (idChecked) {
        checks.push("idChecked");
      }
      if (nameChecked) {
        checks.push("nameChecked");
      }
      if (memberChecked) {
        checks.push("memberChecked");
      }

      res.locals.checks = checks;
      return next();
    },
    getProjects(pool)
  );

  router.get("/edit/:id", checkAuth, function (req, res) {
    const { id } = req.params;

    const sqlProjectName = `SELECT p.name AS projectname ${sqlpart}
    WHERE p.projectid = ${id}`;

    const sqlMembers = `SELECT m.userid, CONCAT(u.firstname, ' ', u.lastname) AS fullname
    FROM members m INNER JOIN users u ON m.userid = u.userid
    WHERE m.projectid = ${id}
    ORDER BY fullname`;

    const sqlAllUser = `SELECT role, userid, CONCAT(firstname, ' ', lastname) AS fullname
    FROM users
    ORDER BY fullname`;

    const getProjectName = pool.query(sqlProjectName);
    const getMembers = pool.query(sqlMembers);
    const getAllUser = pool.query(sqlAllUser);

    Promise.all([getProjectName, getMembers, getAllUser]).then((values) => {
      const results = values.map((value) => value.rows);
      const [projects, members, users] = results;

      const projectName = projects.length ? projects[0].projectname : "";

      const memberIds = members.map((value) => value.userid);

      const allUsers = users.map((value) => ({
        ...value,
        isChecked: memberIds.includes(value.userid),
      }));

      res.render("projects/edit", {
        title: `Edit project ${rows[0].projectname}`,
        projectName,
        users: allUsers,
        projectid: id,
      });
    });
  });

  router.post("/submitedit/:id", async function (req, res, next) {
    const { id } = req.params;
    const { member, name } = req.body;
    const memberIds = Array.isArray(member) ? member : [member];

    // res.send(`
    // <pre>
    //   <code>
    //     member =
    //     ${JSON.stringify(member, null, 2)}
    //   </code>
    // </pre>
    // `);

    // res.send(`memberIds = ${memberIds}`)

    // res.send(
    //   `memberIds = ${JSON.stringify(
    //     memberIds.map((num) => `(${num}, ${id})`).join(", ")
    //   )}`
    // );

    const updateName = `UPDATE projects SET name= '${name}' WHERE projectid = ${id}`;

    const deleteMember = `DELETE FROM members WHERE projectid = ${id}`;

    const addMember = `INSERT INTO members(role, userid, projectid) 
    VALUES ${memberIds.map((num) => `(${num}, ${id})`).join(", ")}`;

    await pool.query(updateName);
    await pool.query(deleteMember);
    await pool.query(addMember);

    res.redirect('/projects');

   
  });

  router.get("/add", checkAuth, function (req, res, next) {
    let sql = `select * from users`;
    pool.query(sql, (err, row) => {
      console.log(sql);
      if (err) throw err;

      console.log("Success add Projects");
      res.render("projects/add", { data: row.rows, title: `Add project ${rows[0].projectname}`, });
    });
  });

  router.post("/add", function (req, res, next) {
    let sql = `INSERT INTO projects (name) values ('${req.body.name}');`;
    console.log(sql);

    pool.query(sql, (err) => {
      if (err) {
        console.log("error");
      }
      let view = `SELECT projectid FROM projects order by projectid desc limit 1`;
      console.log(view);

      pool.query(view, (err, row) => {
        let temp = [];
        let idProject = row.rows[0].projectid;

        if (typeof req.body.member == "string") {
          temp.push(`(${req.body.member}, ${idProject})`);
        } else {
          for (let i = 0; i < req.body.member.length; i++) {
            temp.push(`(${req.body.member[i]}, ${idProject})`);
          }
        }
        let sqlsave = `INSERT INTO members (role, userid, projectid) values ${temp.join(
          ","
        )}`;
        console.log(sqlsave);

        pool.query(sqlsave, () => {
          res.redirect("/projects");
        });
      });
    });
  });

  router.get("/deleted/:projectid", checkAuth, async (req, res) => {
    const {projectid} = req.params;
    const {current} = req.query;

    const sqlDelMembers = `DELETE FROM members WHERE projectid = ${projectid}`;
    const sqlDelProjects = `DELETE FROM projects WHERE projectid = ${projectid}`;

    await pool.query(sqlDelMembers);
    await pool.query(sqlDelProjects);

    res.redirect(`/projects?page=${current}`);


    // pool.query(sql, [], (err, row) => {
    //   console.log(row.rows);
    //   res.render("projects", { model: row.rows });
    // });
  });

  router.get("/overview/:id", checkAuth, function (req, res, next) {
    res.render("projects/overview", { id: req.params.id, title: `Project detail of ${req.params.id}`, });
  });

  router.get("/activity/:id", checkAuth, function (req, res, next) {
    res.render("projects/activity", { id: req.params.id, title: `Activity of ${req.params.id}`});
  });

  return router;
};
