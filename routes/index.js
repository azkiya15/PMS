var express = require("express");
var router = express.Router();

module.exports = (pool) => {
  /* GET home page. */
  router.get("/", function (req, res, next) {
    if(req.session.user){
        res.redirect("/projects")
        return
    }
    res.render("index", { title: "PMS", loginInfo: req.flash("loginInfo")[0], latestUrl: req.session.url });
  });

  router.post("/login", function (req, res) {
    const { email, password, latestUrl } = req.body;
    let sql = `SELECT * FROM users WHERE email =$1`;
    pool
      .query(sql, [email])
      .then((row) => {
        if (row.rows.length > 0) {
          if (row.rows[0].password == password) {
            req.session.user = row.rows[0]
            res.redirect(latestUrl || "/projects");
          } else {
            console.log("Salah password");

            req.flash("loginInfo", "email or password doesnt match");
            res.redirect("/");
          }
        } else {
          req.flash("loginInfo", "email or password doesnt match");
          res.redirect("/");
        }
      })
      .catch((err) => {
        req.flash("loginInfo", "Try Again");
        res.redirect("/");
      });
  });

  router.get("/logout", function (req, res, next) {
    req.session.destroy(() => {
        res.redirect("/");
    })
  });

  return router;
};
