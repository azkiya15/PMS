var express = require('express');
var router = express.Router();

module.exports = (pool) => {
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('members/list', { title: 'Express' });
});

router.get('/edit', function(req, res, next) {
    res.render('members/edit', { title: 'Express' });
 });

router.get('/add', function(req, res, next) {
   res.render('members/add', { title: 'Express' });
});

return router;
};