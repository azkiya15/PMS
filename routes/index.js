var express = require('express');
var router = express.Router();

module.exports = (pool) => {
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express'});
});

router.post('/login', function(req, res) {
  const { email, password } = req.body;
  let sql = `SELECT * FROM users WHERE email =$1`;
        pool.query(sql, [email]).then(row => {
            if (row.rows.length > 0) {
                if (row.rows[0].password == password) {
                    // req.session.user = row.rows[0]
                    res.redirect('/projects')
                } else {
                    console.log('Salah password');

                    req.flash('loginInfo', 'user or password doesnt match')
                    res.redirect('/')
                }
            } else {
                req.flash('loginInfo', 'user doesnt exist')
                res.redirect('/')
            }
        }).catch(err => {
            console.log(err);
            req.flash('loginInfo', 'Try Again')
            res.redirect('/')
        })
})

router.get('/profile', function(req, res, next) {
  res.render('profile', { title: 'Express'});
});

return router;
};