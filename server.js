//|===================================================================================|
//|============================== Ajout des frameworks ===============================|
//|===================================================================================|
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require("fs");
var fonction = require("./js/fonction.js");
var mySocket = require("./js/mySocket.js");
var mongoose = require('mongoose');
var MongoClient = require('mongodb').MongoClient;
app.use('/public', express.static(__dirname + '/public'));
app.use('/node_modules', express.static(__dirname + '/node_modules'));
app.use('/bower_components', express.static(__dirname + '/bower_components'));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
//|===================================================================================|
//|==================== Déclaration/initialisation des variables =====================|
//|===================================================================================|
var conf = JSON.parse(fs.readFileSync('conf.json'));
var ipServer = fonction.getIpAddress();
//|===================================================================================|
//|=================================== Module KNX ====================================|
//|===================================================================================|
KnxHelper = require('./src/KnxHelper.js');
KnxConnectionTunneling = require('./src/KnxConnectionTunneling.js');
exports.KnxHelper = KnxHelper;
exports.KnxConnectionTunneling = KnxConnectionTunneling;
var KnxConnectionTunneling = require('knx.js').KnxConnectionTunneling;
var connection = new KnxConnectionTunneling(conf.ipPlateauknx, conf.portPlateauknx, ipServer, conf.portServer);
fonction.connectionknx(connection, function() {
    if (connection.connected) {
        fonction.getAll(connection);
        mySocket.socketListenerKNX(io, connection);
    }
});
mySocket.socketClient(io, mySocket, connection);
//|===================================================================================|
//|========================== Régle les pb de cross domain ===========================|
//|===================================================================================|
app.use(function(req, res, next) {
    var origin = req.headers.origin;
    res.setHeader('Access-Control-Allow-Origin', "null");
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    // Pass to next layer of middleware
    next();
});
//|===================================================================================|
//|============================== Affichage de la page ===============================|
//|===================================================================================|
app.all('/', function(req, res) {
    res.sendFile('/index.html', {
        root: __dirname
    });
});
/*

mongoose.connection.on('open', function(ref) {
console.log('Connecté au serveur MongoDB');
});

mongoose.connection.on('error', function(err) {
    console.log('Impossible de se connecter au serveur!');
    console.log(err);
});

mongoose.connect('mongodb://localhost:27016/modeles', function(err) {
  if (err) { throw err; }
  else{
    console.log("mongodb modeles install");
  }
});*/
//|===================================================================================|
//|============================== Lancement du server  ===============================|
//|===================================================================================|
http.listen(conf.portServer, function() {
    console.log('listening adresse : ' + ipServer + ' on port : ' + conf.portServer);
});
//|===================================================================================|
//|====================== Deconnection et shut down du server  =======================|
//|===================================================================================|
process.on('SIGINT', function() {
    if (connection.connected) {
        console.log('deconnection du tunel KNX');
        fonction.deconnectionknx(connection, function() {
            console.log('shut down server');
            process.exit();
        });
    } else {
        console.log('shut down server');
        process.exit();
    }
});