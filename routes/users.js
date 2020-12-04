var express = require('express');
var router = express.Router();

module.exports = (pool) => {
router.get('/', function(req, res, next) { 

  //FILTER
  const { ckid, userid, ckname, name, ckposition, role, ckworkstat, work_status } = req.query;
  let params = [];

  if (ckid && userid) {
    params.push(`users.userid = ${userid}`);
  }
  if (ckname && name) {
    params.push(`CONCAT (users.firstname,' ',users.lastname) LIKE '%${name}%'`)
  }
  if (ckposition && role) {
    params.push(`users.role = '${role}'`)
  }
  if (ckworkstat && work_status) {
    params.push(`users.status = '${work_status}'`)
  }


  //==========PAGINATION=============
  let stat = false

  let url = (req.url == '/') ? `/?page=1` : req.url
  let page = req.query.page || 1; // nilai awal page
  let limit = 3; // batas data yang di tampilkan 
  let pages = (page - 1) * limit

  let sql = `SELECT count(*) as total FROM users`;

  pool.query(sql, [], (err, count) => {

    let rows = count.rows[0].total //jumlah data dalam table
      // console.log(count[0]);
    let totalPage = Math.ceil(rows / limit) // mencari jumlah data
    

    sql = `select userid, firstname, role, work_status from users`;

    console.log('this sql ', sql);
    if (params.length > 0) {
      sql += ` where ${params.join(" AND ")}`
    }

    if (stat == true) {
      sql += ` where ${joindata} `
    }

    sql += ` LIMIT ${limit} OFFSET ${pages}`

    pool.query(sql, [], (err, row) => {

    
    console.log(row.rows);
    res.render('users/index', { model: row.rows, pages: totalPage, current: page, query: req.query, url: url});

    })
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
  
  const { firstname, lastname, email, password, position, workingstatus, status } = req.body
  let type = req.body.type ? true : false;
  console.log('this req body>', req.body);



  let sql2 = `UPDATE users SET firstname='${firstname}', lastname='${lastname}', role='${position}', work_status='${workingstatus}, status='${status}' WHERE userid ='${req.params.userid}' `
  
  if (password && email !== '') {
    sql2 = `UPDATE users SET firstname='${firstname}', lastname='${lastname}', email= '${email}', password ='${password}', role='${position}', work_status='${workingstatus}', status='${status}' WHERE userid ='${req.params.userid}'`;
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
    req.body.position,
    req.body.status
  ];
  const sql =
    "INSERT INTO users(email, password, firstname, lastname, work_status, role, status) VALUES ($1, $2, $3, $4, $5, $6, $7)";
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

    res.redirect("/users");

  })
})

return router;
};