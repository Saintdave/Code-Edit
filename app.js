/*
 *
 * Author: Tronmint
 * Date: 4/24/2021
 * 
 */

require('dotenv').config();
require('./database/mysql') // load MySQL database
const http = require('http');
const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const api_route_v1 = require('./routes/api/v1/index.js');
const app = express();

// set up public path
let public_path = path.resolve(__dirname, 'src');
app.use(express.static(public_path));

// set up the view engine for express
app.engine(
    'hbs',
    exphbs({
        defaultLayout: 'main',
        extname: '.hbs'
    })
);

app.set('view engine', 'hbs');

// route for API version 1
app.use('/api/v1', api_route_v1);

// route to Dapp homepage
app.get('/', (req, res) => {
    res.render('tronwage', {
        year: new Date().getFullYear()
    });
});

// route to Dapp page
app.get('/:page', (req, res) => {
    res.render('tronwage', {
        year: new Date().getFullYear()
    });
});

// route to Dapp page and section
app.get('/:page/:section', (req, res) => {
    res.redirect(`/${req.params.page}`);
});

// handle page not found
app.use((req, res) => {
    res.status(404);
    res.send('Is like your lost');
});

//start listening on provided port
http.createServer(app).listen(
    process.env.PORT,
    () => {
        console.log(`Tronmint server started on port ${process.env.PORT}`);
    }
);

/*var server = http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    var message = 'Welcome to Tronwage, site under development!\n',
        version = 'NodeJS ' + process.versions.node + '\n',
        response = [message, version].join('\n');
    res.end(response);
});
server.listen();*/