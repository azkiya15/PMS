var express = require('express');
var router = express.Router();
var pathnode = require('path');
const bodyParser = require('body-parser');
var moment = require('moment');


//------BODY PARSER-----------\\
// parse application/x-www-form-urlencoded
router.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
router.use(bodyParser.json())
//----------END BP----------\\

var path = "projects";
module.exports = (pool) => {
/* GET home page. */
router.get('/', function(req, res, next) {
  
 

    sql = `select members.id, projects.name, users.firstname
    from members, projects, users
    where projects.projectid = members.projectid
    and members.userid = users.userid;
    `;
   

    pool.query(sql, [], (err, row) => {

      console.log(row.rows);
      res.render('projects', { model: row.rows});

    })


  });

router.get('/edit/:id', function(req, res) {
  
  let edit = parseInt(req.params.id);
  let sql = `select members.id, projects.name, users.firstname
  from members, projects, users
  where projects.projectid = members.projectid
  and members.userid = users.userid
  and members.id = $1`;
  console.log(sql);
  pool.query(sql, [edit], (err, data) => {
    pool.query(`SELECT * FROM users`, (err, user) => {
      if (err) throw err;
      console.log('suksess edit');
      res.render('projects/edit', {
        name: data.rows[0].name,
        id: data.rows[0].id,
        members: data.rows.map(item => item.userid),
        users: user.rows,
        path,
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
    res.render('projects/add', { data: row.rows, path })
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