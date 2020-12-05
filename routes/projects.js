var express = require('express');
var router = express.Router();

module.exports = (pool) => {
router.get('/', function(req, res, next) {
  
  //==========FILTER===============
  const { ckid, id, ckname, name, ckfirstname, firstname } = req.query;
  let params = [];

  if (ckid && id) {
    params.push(`members.id = ${id}`);
  }
  if (ckname && name) {
    params.push(`projects.name = '${name}'`)
  }
  if (ckfirstname && firstname) {
    params.push(`CONCAT (users.firstname,' ',users.lastname) LIKE '%${firstname}%'`)
  }



  //=========PAGINATION===========
  let stat = false

  let url = (req.url == '/') ? `/?page=1` : req.url
  let page = req.query.page || 1; // nilai awal page
  let limit = 3; // batas data yang di tampilkan 
  let pages = (page - 1) * limit

  let sql = `SELECT count(*) as total from members`;

  pool.query(sql, [], (err, count) => {

    let rows = count.rows[0].total //jumlah data dalam table
      console.log("TOTAL ", rows);
    let totalPage = Math.ceil(rows / limit) // mencari jumlah data

      sql = `select members.id, projects.name, users.firstname
      from members, projects, users
      where projects.projectid = members.projectid
      and members.userid = users.userid`;
  
      if (params.length > 0) {
        sql += ` where ${params.join(" AND ")}`
      }
      

      if (stat == true) {
        sql += ` where ${joindata} `
      }
      
      sql += ` LIMIT ${limit} OFFSET ${pages}`

      pool.query(sql, [], (err, row) => {

        console.log(row.rows);
        res.render('projects/index', { model: row.rows, pages: totalPage, current: page, query: req.query, url: url });

      })

  })

  });

router.get('/edit/:id', function(req, res) {
  
  let edit = parseInt(req.params.id);
  let sql = `SELECT members.userid, projects.name, projects.projectid 
  FROM members LEFT JOIN projects ON projects.projectid = members.projectid 
  WHERE projects.projectid = $1`;
  console.log(sql);
  pool.query(sql, [edit], (err, data) => {
    pool.query(`SELECT * FROM users`, (err, user) => {
      if (err) throw err;
      console.log('suksess edit');
      res.render('projects/edit', {
        id: data.rows[0].id,
        name: data.rows[0].name,        
        members: data.rows.map(item => item.userid),
        users: user.rows
        })

    })

  })
});

router.post('/submitedit/:id', function(req, res, next) {
  const { name, member } = req.body;
  let id = req.params.projectid;

  let sql = `UPDATE projects SET name= '${req.body.name}' WHERE projectid=${req.params.projectid}`;
  console.log(sql);

  pool.query(sql, (err, row) => {
    if (err) throw err;
    pool.query(`DELETE FROM members WHERE projectid = ${req.params.projectid}`, (err) => {
      let temp = []
      if (typeof req.body.member == 'string') {
        temp.push(`(${req.body.member}, ${id})`)
      } else {
        for (let i = 0; i < member.length; i++) {
          temp.push(`(${member[i]}, ${id})`)
        }
      }

      console.log('Done Update');
      let input = `INSERT INTO members (role, userid, projectid) values ${temp.join(',')}`;
      pool.query(input, (err) => {
        res.redirect('/projects')
      })
    })
  });
})

router.get('/add', function(req, res, next) {
  let sql = `select * from users`;
  pool.query(sql, (err, row) => {
    console.log(sql);
    if (err) throw err;

    console.log('Susccess add Projects');
    res.render('projects/add', { data: row.rows })
  })
});

router.post('/add', function(req, res, next) {
  let sql = `INSERT INTO projects (name) values ('${req.body.name}');`
  console.log(sql);

  pool.query(sql, (err) => {
    if (err) { console.log('error') }
    let view = `SELECT projectid FROM projects order by projectid desc limit 1`;
    console.log(view);

    pool.query(view, (err, row) => {
      let temp = []
      let idProject = row.rows[0].projectid;

      if (typeof req.body.member == 'string') {
        temp.push(`(${req.body.member}, ${idProject})`)
      } else {
        for (let i = 0; i < req.body.member.length; i++) {
          temp.push(`(${req.body.member[i]}, ${idProject})`)
        }
      }
      let sqlsave = `INSERT INTO members (role, userid, projectid) values ${temp.join(',')}`;
      console.log(sqlsave);

      pool.query(sqlsave, () => {
        res.redirect('/projects')
      })
    })
  })
})

router.get('/deleted/:projectid', (req, res) => {
  
  sql = `DELETE FROM members WHERE projectid = ${req.params.projectid}`;
   

    pool.query(sql, [], (err, row) => {

      console.log(row.rows);
      res.render('projects', { model: row.rows});

    })

})

router.get('/overview', function(req, res, next) {
  res.render('projects/overview', { title: 'Express' });
});

router.get('/issues', function(req, res, next) {
  res.render('issues/issues', { title: 'Express' });
});

router.get('/editIssues', function(req, res, next) {
  res.render('issues/edit', { title: 'Express' });
});

router.get('/addIssues', function(req, res, next) {
  res.render('issues/add', { title: 'Express' });
});

router.get('/activity', function(req, res, next) {
  res.render('projects/activity', { title: 'Express' });
});

return router;
};