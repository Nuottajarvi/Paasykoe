var express = require('express');
var mysql = require('mysql');
var flash = require('connect-flash');
var methodOverride = require('method-override');
var session = require('express-session');
var pool = mysql.createPool({
	connectionLimit: 50,
	host:'*****',
	user:'*****',
	password:'*****',
	database:'*****',
});

var https = require('https');

var MD5 = require("md5");

var fs = require('fs');

var databases = ["", "*****"];

var questionCount = {};

var request = require('request');

var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var app = express();
var crypto = require('crypto');
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

var fs = require('fs');
var index = fs.readFileSync('website/index.html');

multiUserTokens = {};
questionIndex = {};

//Password email
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: '*****',
		pass: '*****'
	}
});

app.use(express.static('website'));
app.use(express.static('images'));

app.get('/', function (req, res) {
	res.setHeader('Content-Type', 'text/plain');
	res.end(index);
	return;
});

app.post('/sendcode', function(req, res){
	
	securityCode = makeid();

	pool.getConnection(function(err, connection) {
		if(err){
			console.log(err);
			res.status(500).send("Tietokantaan ei juuri nyt saada yhteyttä. Yritä hetken kuluttua uudelleen");
			connection.release();
			return;
		}
		
		if(req.body.email == "" || req.body.email == undefined){
			res.status(400).send("Puuttuva sähköpostiosoite");
			connection.release();
			return;
		}
		var email = req.body.email;	
		
		findByEmail(email, function(err, results){
			if(err){
				console.log(err);
				res.status(500).send("Ongelma tietokannassa. Ota yhteyttä järjestelmänvalvojaan");
				connection.release();
				return;
			}
			if(results.length === 0){
				res.status(401).send("Tällä sähköpostiosoitteella ei ole käyttäjää järjestelmässä");
				connection.release();
				return;
			}
			
			var sql = 'UPDATE users SET code=' + connection.escape(securityCode) + ' WHERE email=' + connection.escape(email);
			
			connection.query(sql, function(err, result){
				if(err){
					console.log(err);
					res.status(500).send("Ongelma tietokannassa. Ota yhteyttä järjestelmänvalvojaan");
					connection.release();
					return;
				}
				connection.release();
				var mailOptions = {
					*****
				};

				// send mail with defined transport object
				transporter.sendMail(mailOptions, function(err, info){
					if(err){
						console.log(err);
						res.status(500).send("Ongelma järjestelmässä. Ota yhteyttä järjestelmänvalvojaan");
						return;
					}
					res.status(200).send("Sähköposti lähetetty");
				});
			});
		});
	});
});

function makeid(){
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

app.post('/changePassword', function(req, res){
	pool.getConnection(function(err, connection) {
		if(err){
			console.log(err);
			res.status(500).send("Tietokantaan ei juuri nyt saada yhteyttä. Yritä hetken kuluttua uudelleen");
			connection.release();
			return;
		}
		
		if(req.body.email == "" || req.body.email == undefined){
			res.status(400).send("Puuttuva sähköpostiosoite");
			connection.release();
			return;
		}
		
		var email = req.body.email;
		
		findByEmail(email, function(err, results){
			if(err){
				console.log(err);
				res.status(500).send("Ongelma tietokannassa. Ota yhteyttä järjestelmänvalvojaan");
				return;
			}
			
			if(results.length === 0){
				res.status(400).send("Sähköpostiosoitetta ei löydetty tietokannasta");
				return;
			}
			
			if(req.body.oldhash == undefined){
				if(results[0].code != req.body.code){
					res.status(401).send("Virheellinen turvakoodi");
					return;
				}
			}else{
				var oldh = req.body.oldhash.words;
				var oldhash = "" + oldh[0] + oldh[1] + oldh[2] + oldh[3] + oldh[4];

				if(results[0].password != oldhash){
					res.status(401).send("Virheellinen salasana");
					return;
				}
			}
			if(req.body.hash == [] || req.body.hash == undefined){
				res.status(400).send("Puuttuva salasana");
				return;
			}
	
			var h = req.body.hash.words;
			var hash = "" + h[0] + h[1] + h[2] + h[3] + h[4];
			
			var sql = 'UPDATE users SET password=' + connection.escape(hash) + ' WHERE email=' + connection.escape(email);
			
			connection.query(sql, function(err, result){
				if(err){
					console.log(err);
					res.status(500).send("Ongelma tietokannassa. Ota yhteyttä järjestelmänvalvojaan");
					connection.release();
					return;
				}
				connection.release();
				res.status(200).send("Salasanan vaihto onnistui");
			});
		});
	});
});

app.post('/checkpaid', function(req, res){
	verify(req.body.token, function(user){
		if(user == undefined){
			res.status(200).send(false);
			return;
		}
		getLicensesForUser(user, function(licenses){
			res.status(200).send(licenses.indexOf(1) != -1);
		});
	});
});

app.post('/email', function(req, res){
	verify(req.body.token, function(user){
		if(user == undefined){
			res.status(200).send("");
			return;
		}
		res.status(200).send(user);
	});
});

function verify(token, cb){
	jwt.verify(token, '*****', function(err, decoded){
		if(err){
			//Not logged in
			cb();
			return;
		}
		cb(decoded.user);
	});
}

app.post('/question', function (req, res){
	
	//If not logged in
	verify(req.body.token, function(email){
		if(email == undefined){
			res.status(401).send("Et ole kirjautunut sisään");
			return;
		}else{
			if(req.body.token2 != multiUserTokens[email]){
				res.status(401).send("Sivustomme on päivittynyt tai kirjauduit sisälle toisella laitteella. Kirjaudu uudelleen sisään");
				return;
			}
		
			getLicensesForUser(email, function(licenses){
			
				//Checking if you have license
				if(licenses.indexOf(databases.indexOf(req.body.db)) == -1){
					res.status(402).send("Et ole ostanut vielä palvelua");
					return;
				}
			
				pool.getConnection(function(err, connection) {
					if(err){
						console.log(err);
						res.status(500).send("Tietokantaan ei juuri nyt saada yhteyttä. Yritä hetken kuluttua uudelleen.");
						connection.release();
						return;
					}

					//Aihealueiden valinta
					//J = Johtaminen
					//L = Laskentatoimi
					//M = Matematiikka
					//T = Taloustiede
					var subjects = '"A"';
					var subjectIdentifiers = ['"J"', '"L"', '"M"', '"T"'];
					for(var i = 0; i < 4; i++){
						if(req.body.selectedSubjects[i]){
							subjects+="," + subjectIdentifiers[i];
						}
					}

					if(databases.indexOf(req.body.db) == -1){
						res.status(403).send("L33T HAX0R! Yes, yes we are protected from MySQL injection. Thanks for trying!");
						connection.release();
						return;
					}

					connection.query('SELECT COUNT(*) FROM ' + req.body.db + ' WHERE aihealue IN (' + subjects + ')', function(err, results, fields){
						if(err){
							console.log(err);
							questionCount[db] = 0;
							connection.release();
							return;
						}

						var questionCount = results[0]['COUNT(*)'];
						
						if(questionCount == 0){
							connection.release();
							res.status(500).send("Et ole valinnut ainuttakaan aihealuetta");
							return;
						}

						if(!questionIndex[email]){
							questionIndex[email] = Math.floor(Math.random() * questionCount);
						}

						questionIndex[email] += 1 + Math.floor(Math.random() * 5);
						if(questionIndex[email] >= questionCount){
							questionIndex[email] = Math.floor(Math.random() * questionCount / 2);
						}
										
						var sql = 'SELECT * FROM ' + req.body.db + ' WHERE aihealue IN (' + subjects + ') ORDER BY id LIMIT 1 OFFSET ' + connection.escape(questionIndex[email]);
						connection.query(sql, function(err, results, fields){
							if(err){
								connection.release();
								console.log(err);
								res.status(500).send("Ongelma tietokannassa. Ota yhteyttä järjestelmänvalvojaan");
								return;
							}
							res.json(results);
							connection.release();
						});
					});
				});
			});
		}
	});
});

app.post('/demoquestion', function (req, res){
			
	pool.getConnection(function(err, connection) {
		if(err){
			console.log(err);
			res.status(500).send("Tietokantaan ei juuri nyt saada yhteyttä. Yritä hetken kuluttua uudelleen.");
			connection.release();
			return;
		}

		if(databases.indexOf(req.body.db) == -1){
			res.status(403).send("Virheellinen kutsu");
			connection.release();
			return;
		}else{
			if(req.body.id > 4){
				req.body.id = 1;
			}

			var sql = 'SELECT * FROM ' + req.body.db + ' ORDER BY id LIMIT 1 OFFSET ' + connection.escape(req.body.id);
			connection.query(sql, function(err, results, fields){
				if(err){
					console.log(err);
					connection.release();
					res.status(500).send("Ongelma tietokannassa. Ota yhteyttä järjestelmänvalvojaan");
					return;
				}
				res.json(results);
				connection.release();
			});
		};
	});
});

app.post('/exam', function (req, res){
	
	//If not logged in
	verify(req.body.token, function(email){
		if(email == undefined){
			res.status(401).send("Et ole kirjautunut sisään");
			return;
		}else{
			if(req.body.token2 != multiUserTokens[email]){
				res.status(401).send("Sivustomme on päivittynyt tai kirjauduit sisälle toisella laitteella. Kirjaudu uudelleen sisään");
				return;
			}
		
			getLicensesForUser(email, function(licenses){
			
				//Checking if you have license
				if(licenses.indexOf(databases.indexOf(req.body.db)) == -1){
					res.status(402).send("Et ole ostanut vielä palvelua");
					return;
				}
			
				pool.getConnection(function(err, connection) {
					if(err){
						console.log(err);
						res.status(500).send("Tietokantaan ei juuri nyt saada yhteyttä. Yritä hetken kuluttua uudelleen.");
						connection.release();
						return;
					}

					var questions = [];

					//Aihealueiden valinta
					//J = Johtaminen
					//L = Laskentatoimi
					//M = Matematiikka
					//T = Taloustiede

					for(var i = 0; i < 40; i++){

						examLoop();

						function examLoop(){

							var subjects = "";
							var index = i;

							if(index < 13)
								subjects = '"J"';
							else if(index < 26)
								subjects = '"L"';
							else if(index < 33)
								subjects = '"M"';
							else
								subjects = '"T"';
									
							if(databases.indexOf(req.body.db) == -1){
								res.status(403).send("Virheellinen kutsu");
								connection.release();
								return;
							}
							connection.query('SELECT COUNT(*) FROM ' + req.body.db + ' WHERE aihealue IN (' + subjects + ')', function(err, results, fields){
								if(err){
									console.log(err);
									questionCount[db] = 0;
									connection.release();
									return;
								}

								var questionCount = results[0]['COUNT(*)'];
								
								if(questionCount == 0){
									connection.release();
									res.status(500).send("Et ole valinnut ainuttakaan aihealuetta");
									return;
								}else{		

									if(!questionIndex[email]){
										questionIndex[email] = Math.floor(Math.random() * questionCount);
									}

									questionIndex[email] += 1 + Math.floor(Math.random() * 5);
									if(questionIndex[email] >= questionCount){
										questionIndex[email] = Math.floor(Math.random() * questionCount / 2);
									}

									var sql = 'SELECT * FROM ' + req.body.db + ' WHERE aihealue IN (' + subjects + ') ORDER BY id LIMIT 1 OFFSET ' + connection.escape(questionIndex[email]);
									connection.query(sql, function(err, results, fields){
										if(err){
											connection.release();
											console.log(err);
											res.status(500).send("Ongelma tietokannassa. Ota yhteyttä järjestelmänvalvojaan");
											return;
										}
										results[0].id = index;
										questions.push(results[0]);

										if(questions.length == 40){
											connection.release();
											res.json(questions);
										}
									});
								};
							});
						};
					}
				});
			});
		}
	});
});

app.post('/feedback', function(req, res){

	verify(req.body.token, function(user){

		pool.getConnection(function(err, connection) {
			if(err){
				console.log(err);
				res.status(500).send("Tietokantaan ei juuri nyt saada yhteyttä. Yritä hetken kuluttua uudelleen.");
			}

			var sql = 'INSERT INTO palaute (teksti, email) VALUES (' 
			+ connection.escape(req.body.feedback) + ","
			+ connection.escape(user) + ")";
			connection.query(sql, function(err, results, fields){
				if(err){
					console.log(err);
					res.status(400).send(err);
					connection.release();
					return;
				}
				res.json({});
				connection.release();
			});
		});
	});
});

app.post('/createaccount', function (req, res){
	
	if(req.body.email == "" || req.body.email == undefined){
		res.status(400).send("Puuttuva sähköpostiosoite");
		return;
	}
	
	if(req.body.hash == "" || req.body.hash == undefined){
		res.status(400).send("Puuttuva sähköpostiosoite");
		return;
	}

	var email = req.body.email;		
	var h = req.body.hash.words;
	var hash = "" + h[0] + h[1] + h[2] + h[3] + h[4];	
	
	//Check for duplicate email
	findByEmail(email, function(err, results){
		if(err){
			console.log(err);
			res.status(500).send("Ongelma tietokannassa. Ota yhteyttä järjestelmänvalvojaan");
			connection.release();
			return;
		}

		pool.getConnection(function(err, connection) {
			if(err){
				console.log(err);
				connection.release();
				cb(err, []);
				return;
			}

			if(results.length === 0){

				var sql = 'INSERT INTO users (email, password,licenses,marketingresearch) VALUES (' + connection.escape(email) + ',' + connection.escape(hash) + ', "", ' + connection.escape(req.body.marketingresearch) + ')';
				connection.query(sql, function(err, result){
					if(err){
						console.log(err);
						res.status(500).send("Ongelma tietokannassa. Ota yhteyttä järjestelmänvalvojaan");
						connection.release();
						return;
					}
					connection.release();
					res.json({});
				});
			}else{
				res.status(401).send("Kyseisellä sähköpostiosoitteella on jo käyttäjä");
			}
		});
	});
});

function findByEmail(email, cb) {
	
	pool.getConnection(function(err, connection) {
		if(err){
			console.log(err);
			connection.release();
			cb(err, []);
			return;
		}
		var sql = 'SELECT * FROM users WHERE email = ' + connection.escape(email);
		connection.query(sql, function(err, results, fields){
			if(err){
				console.log(err);
				connection.release();
				cb(err, []);
				return;
			}
			connection.release();
			cb(undefined, results);
		});
	});
};

var bruteforcePausing = [];

app.post('/authenticate', function (req, res){
	if(bruteforcePausing.indexOf(req.body.email) != -1){
		res.status(503).send("Can't send an authentication request that often");
		return;
	}
		
	findByEmail(req.body.email, function(err, cb){
		if(err){
			console.log(err);
			res.status(501).send("Tietokantaan ei juuri nyt saada yhteyttä");
		}
		
		if(cb.length != 0){
			if(req.body.password == [] || req.body.password == undefined){
				res.status(400).send("Puuttuva salasana");
				return;
			}
			
			var reqPassword = "" + req.body.password.words[0] + req.body.password.words[1] 
			+ req.body.password.words[2] + req.body.password.words[3] + req.body.password.words[4];
			
			if(reqPassword == cb[0].password){
				
				reqPassword = "";
				
				var token = jwt.sign({user: cb[0].email}, '*****',{
					expiresIn: "2h" 
				});
				
				var multiUserToken = makeid();
				multiUserTokens[req.body.email] = multiUserToken;

				res.status(200).json({
					"message": "Kirjautuminen onnistui",
					"token": token,
					"token2": multiUserToken
				});
				
			}else{
				reqPassword = "";
				bruteforcePausing.push(cb[0].email);
				setTimeout(function() {
					bruteforcePausing.splice(bruteforcePausing.indexOf(cb[0].email), 1);
					res.status(401).json({"message": "Virheellinen salasana"});
				}, 1000);
			}
		}else{
			res.status(401).json({"message": "Sähköpostiosoitetta ei löytynyt"});
		}
	});
});


app.post('/createPayment', function (req, res){
	
	if(req.body.client == "" || req.body.client == undefined){
		res.status(400).send("Puuttuvat asiakastiedot");
		return;
	}
		
	var orderNumber = new Date().getTime() * 1000 + Math.floor(Math.random() * 999);

	var product = {};
	product.vat = 0.24;
	product.code = "kauppatiede";
	product.title = "Paasykoe.fi - Kauppatieteiden lisenssi";
	product.price = 39.90;
	
	var status = addPayment(orderNumber, databases.indexOf(product.code), req.body.client.email, function(status){
		if(status == 501){
			res.status(501).send("Tietokantaan ei juuri nyt saada yhteyttä");
			return;
		}

		var options = {
			uri: "https://payment.paytrail.com/api-payment/create",
			
			auth: {
				username: "*****",
				password: "*****"
			},
			headers: {
				"Content-Type":"application/json", 
				"X-Verkkomaksut-Api-Version":"1"
			},
			json: true,
			body: 
			{
			  "orderNumber": orderNumber,
			  "currency": "EUR",
			  "locale": "fi_FI",
			  "urlSet": {
				"success": "http://www.paasykoe.fi/paymentsuccesful.html",
				"failure": "http://www.paasykoe.fi/paymentfailed.html",
				"pending": "",
				"notification": "http://www.paasykoe.fi/notification"
			  },
			  "orderDetails": {
				"includeVat": "1",
				"contact": {
				  "telephone": req.body.client.telephone,
				  "mobile": req.body.client.mobile,
				  "email": req.body.client.email,
				  "firstName": req.body.client.firstName,
				  "lastName": req.body.client.lastName,
				  "companyName": req.body.client.companyName,
				  "address": {
					"street": req.body.client.street,
					"postalCode": req.body.client.postalCode,
					"postalOffice": req.body.client.postalOffice,
					"country": "FI"
				  }
				},
				"products": [
				  {
					"title": product.title,
					"code": product.code,
					"amount": "1.00",
					"price": product.price,
					"vat": 24.00,
					"discount": "0.00",
					"type": "1"
				  }
				]
				}
			}
		};
		
		request(options, function(error, response, body){
			if(error){
				console.log(error);
				res.status(501).send("Error connecting to paytrail services");
				return;
			}
			res.status(200).send(body);
		});
				
	});

});

app.get('/notification', function(req, res){
	var q = req.query;
	
	if(q == undefined){
		res.status(400).send("Parametrit puuttuvat");
		return;
	}
	
	var base = q.ORDER_NUMBER + "|" + q.TIMESTAMP + "|" + q.PAID + "|" + q.METHOD + "|*****";
	var md5 = crypto.createHash('md5').update(base).digest("hex");
	md5 = md5.toUpperCase();
	if(md5 == q.RETURN_AUTHCODE){
		var payment = getPayment(q.ORDER_NUMBER, function(err, payment){
			if(err){
				console.log(err);
				res.json(err);
			}
			var status = addLicenseToUser(payment.email, payment.product, function(status){
				res.json(status);			
			});		
		});
		
	}else{
		res.status(400).send("Virheellinen yritys");
	}
});

app.get('/notification', function(req, res){
	var q = req.query;
	
	if(q == undefined){
		res.status(400).send("Parametrit puuttuvat");
		return;
	}
	
	var base = q.ORDER_NUMBER + "|" + q.TIMESTAMP + "|" + q.PAID + "|" + q.METHOD + "|*****";
	var md5 = crypto.createHash('md5').update(base).digest("hex");
	md5 = md5.toUpperCase();
	if(md5 == q.RETURN_AUTHCODE){
		var payment = getPayment(q.ORDER_NUMBER, function(err, payment){
			if(err){
				console.log(err);
				res.json(err);
			}
			var status = addLicenseToUser(payment.email, payment.product, function(status){
				res.json(status);			
			});		
		});
		
	}else{
		res.status(400).send("Virheellinen yritys");
	}
});

function getPayment(orderNumber, cb){
	pool.getConnection(function(err, connection) {
		if(err){
			console.log(err);
			connection.release();
			return;
		}
		var sql = 'SELECT * FROM payments WHERE orderNumber = ' + connection.escape(orderNumber);
		connection.query(sql, function(err, results, fields){
			if(err){
				console.log(err);
				connection.release();
				return;
			}
			connection.release();
			
			if(results.length === 0){
				cb("Maksua ei löydetty tietokannasta", {});
				return;
			}

			cb(undefined, {product: results[0].product, email: results[0].email});			
		});
	});
}

function addPayment(orderNumber, productCode, email, cb){
	
	if(productCode == -1){
		cb(501);
		return;
	}
	pool.getConnection(function(err, connection) {
		if(err){
			console.log(err);
			cb(501);
			connection.release();
			return;
		}

		var sql = 'INSERT INTO payments (orderNumber, product, email) VALUES (' + connection.escape(orderNumber) + ' , ' + connection.escape(productCode) + ',' + connection.escape(email) + ')';
		connection.query(sql, function(err, results, fields){
			if(err){
				console.log(err);
				cb(501);
				connection.release();
				return;
			}
			connection.release();
			cb(200);
		});
	});
}

function addLicenseToUser(email, product, cb){

	getLicensesForUser(email, function(licenses){	
		
		if(licenses.indexOf(product) != -1){
			cb({status: 400, message: "This license already exists on user"});
			return;	
		}
		pool.getConnection(function(err, connection) {
			if(err){
				console.log(err);
				cb({status: 501, message: "Tietokantaan ei saada yhteyttä. Ota yhteys järjestelmänvalvojaan"});
				connection.release();
				return;
			}
			var sql = "UPDATE users SET licenses=concat(licenses," + connection.escape(product + " ") + ") WHERE email = " + connection.escape(email);
			connection.query(sql, function(err, results, fields){
				if(err){
					console.log(err);
					cb({status: 501, message: "Tietokantaan ei saada yhteyttä. Ota yhteys järjestelmänvalvojaan"});
					connection.release();
					return;
				}
				connection.release();
				cb({status: 200, message: "Maksaminen onnistui"});
			});
		});
	});
}

function getLicensesForUser(email, cb){
	findByEmail(email, function(err, results){
		if(err){
			console.log(err);
			cb([]);
			connection.release();
			return;
		}

		if(results.length == 0){
			cb([]);
			connection.release();
			return;
		}
		var string = results[0].licenses;
		var licenses = string.split(' ').map(Number);
		if(!licenses instanceof Array){
			var license = licenses;
			licenses = [];
			licenses.push(license);
		}
		cb(licenses);		
	});
}

server = app.listen(8080, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Application listening at http://%s:%s', host, port);

});
