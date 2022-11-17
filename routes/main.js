const e = require('express');

//required for validation
const { check, validationResult }
    = require('express-validator');

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
            //if no errors
            let newData = Object.assign({}, shopData, {availableBooks:result});
            console.log(newData)
            res.render('list.ejs', newData)
         });        
    });

    //gets the register page
    app.get('/register', function (req,res) {
        res.render('register.ejs', shopData);                                                                     
    });     
    
    //posts the registered page
    app.post('/registered',[
        check('username', 'Username should be more than 4 characters')//checks username is longer than 4 chars
                    .isLength({ min: 4, max: 30 }),
        check('first', 'First name length should be more than')//checks first name is longer than 2 chars
                    .isLength({ min: 2, max: 50 }),
        check('last', 'Last name should be more than 2 characters')
                    .isLength({ min: 2, max: 50 }),
        check('email', 'Email should be more than 8 characters')//checks email is an email
                    .isEmail().isLength({ min: 8, max: 50 }),
        check('password', 'Password length should be 8 to 10 characters')//checks password is at least 8 chars long
                    .isLength({ min: 8, max: 10 })
    ], function (req,res) {
        //initialise bcrypt
        const bcrypt = require('bcryptjs');
        const saltRounds = 10;
        const plainPassword = req.body.password;
        //hashing the password
        bcrypt.hash(plainPassword, saltRounds, function(err, hashedPassword) { 
            console.log(hashedPassword);
            let sqlquery = "INSERT INTO users (username, first, last, email, hashedPassword) VALUES (?,?,?,?,?)";
            let newrecord = [req.body.username, req.body.first, req.body.last, req.body.email, hashedPassword];
            const errors = validationResult(req);//validation happens here
            if (!errors.isEmpty()){
                res.json(errors)//prints any errors with validation the to screen
            }
            else{
            db.query(sqlquery, newrecord, (err, result) => {
                if (err) {
                    return console.error(err.message);
                }
                else
                result = 'Hello '+ req.body.first + ' '+ req.body.last +' you are now registered! We will send an email to you at ' + req.body.email;
                result += 'Your password is: '+ req.body.password +' and your hashed password is: '+ hashedPassword;
                res.send(result);
            })
        }})
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
            let sqlquery = "SELECT * FROM users"; // query database to get all the books
            db.query(sqlquery, (err, result) => {
                let newData = Object.assign({}, shopData, {availableUsers:result});
                res.render('listusers.ejs', newData)
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

    //gets logout page    
    app.get('/logout', function (req, res) {
        res.render('logout.ejs', shopData);
     });

     //posts logges out - will post an error message if no user is logged in
     app.post('/loggedout', async (req, res) => {
        if (req.session.loggedin) {
            delete req.session.loggedin;
            res.send({result: 'SUCCESS'});
        } else {
            //if no user logged in, send error message
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
                    //sets variabel to true, will allow access to otherwise limited pages      
                    req.session.loggedin = true;
                    console.log(req.session.loggedin);//to print to console that 'login' worked
				    req.session.username = username;
                    res.redirect('about');//sends users back to index
                }
                else {
                    res.send("Your Username or Password are incorrect");
                }
            });
        });
    });




    //renders addbook page
    app.get('/addbook', function (req, res) {
        if (req.session.loggedin){
            res.render('addbook.ejs', shopData);
        }else{
            //if no users logged in, will prompt user to log in
            res.send("Please log in");
        }
     });
 
     app.post('/bookadded', function (req,res) {
           // saving data in database
           let sqlquery = "INSERT INTO books (name, price) VALUES (?,?)";
           // execute sql query
           let newrecord = [req.body.name, req.body.price];
           //query database
           db.query(sqlquery, newrecord, (err, result) => {
             if (err) {
               return console.error(err.message);
             }
             else
             //sends data for th elist of books
             res.send(' This book is added to database, name: '+ req.body.name + ' price '+ req.body.price);
             });
       });    
   
    app.get('/bargainbooks', function(req, res) {
        // If the user is loggedin
        if (req.session.loggedin) {
            let sqlquery = "SELECT * FROM books WHERE price < 20";
            // execute sql query
            db.query(sqlquery, (err, result) => {
                if (err) {
                    res.redirect('./');
                 }
                 let newData = Object.assign({}, shopData, {availableBooks:result});
                 console.log(newData)
                 res.render('bargains.ejs', newData)             
             });
             return;
        } else {
            // Not logged in
            res.send('Please login to view this page!');
        }
        res.end();
    });
    
     app.get('/deleteuser', function (req, res) {
        if (req.session.loggedin){
            res.render('deleteuser.ejs', shopData);
        }else{
            res.send("Please log in");
        }
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
