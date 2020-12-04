var express = require('express');
var router = express.Router();

module.exports = (pool) => {
router.get('/', function(req, res, next) { 
  
  sql = `select userid, firstname, role, work_status from users`;
   

  pool.query(sql, [], (err, row) => {

    console.log(row.rows);
    res.render('users', { model: row.rows});

  })
})

router.get('/edit/:userid', function(req, res, next) {
  const userid = req.params.userid;
  const sql = "SELECT * FROM users WHERE userid = $1";
  pool.query(sql, [userid], (err, result) => {
    if (err) {
      return console.error(err.message);
    }
    res.render('users/edit', { content: result.rows[0] });
  });
  
})

router.post('/submitedit/:userid', (req, res) => {
  const { email, password, firstname, lastname, position, workingstatus } = req.body
  let type = req.body.type ? true : false;
  console.log('this req body>', req.body);



  let sql2 = `UPDATE users SET firstname='${firstname}', lastname='${lastname}', role='${position}', work_status='${workingstatus}' WHERE userid ='${req.params.userid}' `
  
  if (password && email !== '') {
    sql2 = `UPDATE users SET email= '${email}', password ='${password}',firstname='${firstname}', lastname='${lastname}', role='${position}', work_status='${workingstatus}' WHERE userid ='${req.params.userid}'`;
  }

  console.log(sql2);

  pool.query(sql2, (err) => {
    res.redirect('/users')

  })
})

router.get('/add', function(req, res, next) {
  res.render('users/add', { title: 'Express'});
})

router.post('/submitadd', (req, res) => {
  const book = [
    req.body.email,
    req.body.password,
    req.body.firstname,
    req.body.lastname,
    req.body.workingstatus,
    req.body.position
  ];
  const sql =
    "INSERT INTO users(email, password, firstname, lastname, work_status, role) VALUES ($1, $2, $3, $4, $5, $6)";
  pool.query(sql, book, (err, result) => {
    if (err) {
      return console.error(err.message);
    }
    res.redirect("/users");
  });
})

router.get('/submitdel/:userid', (req, res) => {
  sql = `DELETE FROM users WHERE userid = ${req.params.userid}`;

  pool.query(sql, [], (err) => {

    res.render('/users');

  })
})

return router;
};