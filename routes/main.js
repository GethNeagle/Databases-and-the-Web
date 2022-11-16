const e = require('express');

module.exports = function(app, shopData) {

    // Handle our routes
    app.get('/',function(req,res){
        res.render('index.ejs', shopData)
    });
    app.get('/about',function(req,res){
        res.render('about.ejs', shopData);
    });

    app.get('/search',function(req,res){

        if (req.session.loggedin){
        res.render('search.ejs', shopData);
        }else{
            res.send('Please log in');
        }
    });
    app.get('/search-result', function (req, res) {
        //searching in the database
        //res.send("You searched for: " + req.query.keyword);

        let sqlquery = "SELECT * FROM books WHERE name LIKE '%" + req.query.keyword + "%'"; // query database to get all the books
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./'); 
            }
            let newData = Object.assign({}, shopData, {availableBooks:result});
            console.log(newData)
            res.render('list.ejs', newData)
         });        
    });
    app.get('/register', function (req,res) {
        res.render('register.ejs', shopData);                                                                     
    });                                                                                                 
    app.post('/registered', function (req,res) {
        //initialise bcrypt
        const bcrypt = require('bcryptjs');
        const saltRounds = 10;
        const plainPassword = req.body.password;
        
          //hashing the password
        bcrypt.hash(plainPassword, saltRounds, function(err, hashedPassword) { 
            console.log(hashedPassword);
            let sqlquery = "INSERT INTO users (username, first, last, email, hashedPassword) VALUES (?,?,?,?,?)";
            let newrecord = [req.body.username, req.body.first, req.body.last, req.body.email, hashedPassword];
            db.query(sqlquery, newrecord, (err, result) => {
             if (err) {
               return console.error(err.message);
             }
             else
             result = 'Hello '+ req.body.first + ' '+ req.body.last +' you are now registered! We will send an email to you at ' + req.body.email;
             result += 'Your password is: '+ req.body.password +' and your hashed password is: '+ hashedPassword;
             res.send(result);
             
        })
            
           })   
    });



    app.get('/list', function(req, res) {
        let sqlquery = "SELECT * FROM books"; // query database to get all the books
        // execute sql query
        db.query(sqlquery, (err, result) => {
            if (err) {
                res.redirect('./'); 
            }
            let newData = Object.assign({}, shopData, {availableBooks:result});
            console.log(newData)
            res.render('list.ejs', newData)
         });
    });




    app.get('/listusers', function(req, res) {
        // If the user is loggedin
        if (req.session.loggedin) {
            console.log("here now")
            let sqlquery = "SELECT * FROM users"; // query database to get all the books
            db.query(sqlquery, (err, result) => {
                let newData = Object.assign({}, shopData, {availableUsers:result});
                res.render('listusers.ejs', newData);  
             });
             return;
            } else {
            // Not logged in
            res.send('Please login to view this page!');
        }
        res.end();
    });

    app.get('/listusers', function(req, res) {
        // If the user is loggedin
        if (req.session.loggedin) {
            console.log("here now") // Output username
            let sqlquery = "SELECT * FROM users"; // query database to get all the books
            // execute sql query
           
            db.query(sqlquery, (err, result) => {
                
  
                let newData = Object.assign({}, shopData, {availableUsers:result});
                res.render('listusers.ejs', newData);
                
             });
             
        } else {
            // Not logged in
            res.send('Please login to view this page!');
        }
        res.end();
    });

    app.get('/logout', function (req, res) {
        res.render('logout.ejs', shopData);
     });

     app.post('/loggedout', async (req, res) => {
        if (req.session.loggedin) {
            delete req.session.loggedin;
            res.send({result: 'SUCCESS'});
        } else {
            res.json({result: 'ERROR', message: 'User is not logged in.'});
        }
    });



    app.get('/login', function (req, res) {
        res.render('login.ejs', shopData);
     });

     app.get('/', function(req, res) {
        // Render login template
        res.sendFile(path.join(__dirname + '/loggedin'));
    });

    app.post('/loggedin', (req, res)=> {
        const bcrypt = require('bcryptjs');
        const username = req.body.username;
        const password = req.body.password;
        db.query('SELECT hashedPassword FROM users WHERE username = ?', [username], function (err, content, fields) {
              //Throws error if any errors during excecution.
              if (err) throw err;
              // if there is no error, produces result.
              hashedPassword = content[0].hashedPassword;
              bcrypt.compare(req.body.password, hashedPassword, function(err, result) {
                if (err) {
                    res.send("Password does not match");
                }
                else if (result == true) {
                    
                    req.session.loggedin = true;
                    console.log(req.session.loggedin);
				    req.session.username = username;
                    res.redirect('/');
                }
                else {
                    res.send("Your Username or Password are incorrect");
                }
            });
              
          });

    });





    app.get('/addbook', function (req, res) {
        if (req.session.loggedin){

        
        res.render('addbook.ejs', shopData);
        }else{
            res.send("Please log in");
        }
     });
 
     app.post('/bookadded', function (req,res) {
           // saving data in database
           let sqlquery = "INSERT INTO books (name, price) VALUES (?,?)";
           // execute sql query
           let newrecord = [req.body.name, req.body.price];
           db.query(sqlquery, newrecord, (err, result) => {
             if (err) {
               return console.error(err.message);
             }
             else
             res.send(' This book is added to database, name: '+ req.body.name + ' price '+ req.body.price);
             });
       });    

       app.get('/bargainbooks', function(req, res) {
        let sqlquery = "SELECT * FROM books WHERE price < 20";
        db.query(sqlquery, (err, result) => {
          if (err) {
             res.redirect('./');
          }
          let newData = Object.assign({}, shopData, {availableBooks:result});
          console.log(newData)
          res.render('bargains.ejs', newData)
        });
    });  
    
    app.get('/deleteuser', function (req, res) {
        res.render('deleteuser.ejs', shopData);
     });

    app.post('/deleted', function(req, res) {
        let id= req.body.username;//query the database for th euser
          let sqlquery = 'DELETE FROM users WHERE username = ?';///sql to delete the user.
          db.query(sqlquery, id, function (err, data) {
          if (err) throw err;
          console.log(data.affectedRows + " record(s) updated");
        });
        res.render('deleteuser', shopData);
        
        
      });





}
