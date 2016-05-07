//|===================================================================================|
//|============================== Ajout des frameworks ===============================|
//|===================================================================================|
var express = require('express'); 
var bodyParser = require('body-parser');
var app = express();
var http = require('http').Server(app);
var io= require('socket.io')(http);
var fs = require("fs");

var objet = require("./js/objet.js");
var fonction= require("./js/function.js");
/*
eval(fs.readFileSync(__dirname + '/js/function.js')+'');
eval(fs.readFileSync(__dirname + '/js/objet.js')+'');*/
app.use('/public',express.static(__dirname + '/public'));
app.use('/node_modules',express.static(__dirname +'/node_modules'));
app.use('/bower_components',express.static(__dirname+'/bower_components'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//|===================================================================================|
//|==================== Déclaration/initialisation des variables =====================|
//|===================================================================================|
var endAugmenter;
var intervalUp;
var intervalDown;
var conf = JSON.parse(fs.readFileSync('conf.json'));
var ipServer=fonction.getIPAddress();
//|===================================================================================|
//|=================================== Module KNX ====================================|
//|===================================================================================|
KnxHelper = require('./src/KnxHelper.js');
KnxConnectionTunneling = require('./src/KnxConnectionTunneling.js');
exports.KnxHelper = KnxHelper;
exports.KnxConnectionTunneling = KnxConnectionTunneling;
var KnxConnectionTunneling = require('knx.js').KnxConnectionTunneling;
var connection = new KnxConnectionTunneling(conf.ipPlateauknx,conf.portPlateauknx,ipServer,conf.portServer );


//|===================================================================================|
//|============================= Initialisation Lampes================================|----------------------------------peut etre à supprimer et a placer avec le init() pour les hues ? 
//|===================================================================================|----------------------------------a tester quand on à la plaque 
//Lampes KNX

    var light=[{adresse:"0/1/1",etat:"error", numero: 1,nbessai:0},{adresse:"0/1/2",etat:"error", numero: 2,nbessai:0},{adresse:"0/1/3",etat:"error", numero: 3,nbessai:0},{adresse:"0/1/4",etat:"error", numero: 4,nbessai:0}];
        

fonction.connectionknx(connection,function(){
    fonction.getall(connection,light);
});



app.use(function (req, res, next) {
    var origin = req.headers.origin;
    //Message qui s'affiche à chaque fois qu'on envoie une requête au serveur (GET/POST/...)
    console.log('Something is happening.');
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
//|===================================================================================|
//|================================== Listener KNK====================================|----------------------a tester si c'est bien pris en compte le fait que j'ai mis le if 
//|===================================================================================|----------------------peut on les mettres dans un autre fichier pour rendre le code plus lisible ? 
//if (connection.connected){

    connection.on('status', function(data, data1, data2) {
        console.log('status : L\'adresse '+data+" est a l'état : "+data1);

        if(data1==0 || data1==1){
        light[data[4]-1].etat=data1;
        }
        else if(data1!=0 && data1!=1 && light[data[4]-1].nberreur<10){
        fonction.getknx(connection,data);
        light[data[4]-1].nberreur++;
        
        }
    }); 

    connection.on('event', function(data, data1, data2) {
        console.log('event : L\'adresse '+data+" est a l'état : "+data1);
        
        if(data[0]==0){
            light[data[4]-1].etat=data1;
            io.emit('lampes',light);
        }
        else if(data[0]==1){    
            if(data1==1){
                if(data[4]==1){
                objet.chenillard.changestate(io,fonction,light,connection);
                }
                else if(data[4]==2){
                objet.chenillard.changeclockwise(io);
                }
                else if(data[4]==3){
                startDiminuer = new Date().getTime();
                intervalDown = setInterval(function(){objet.chenillard.setspeed(io,objet.chenillard.speed+10);},100);
                }
                else if(data[4]==4){
                startAugmenter = new Date().getTime();
                intervalUp = setInterval(function(){objet.chenillard.setspeed(io,objet.chenillard.speed-10);},100);
                 }
             }
            else if(data1==0){
                if(data[4]==3){
                    endDiminuer = new Date().getTime();
                    clearInterval(intervalDown);
                    if((endDiminuer-startDiminuer)<100){
                        objet.chenillard.setspeed(io,objet.chenillard.speed+100);
                    }
                }
                else if(data[4]==4){
                    endAugmenter = new Date().getTime();
                    clearInterval(intervalUp);
                    if((endAugmenter-startAugmenter)<100){
                        objet.chenillard.setspeed(io,objet.chenillard.speed-100);
                    }
                }
            }        
        }
    });
//}

//|===================================================================================|
//|============================= Socket avec le client ===============================|
//|===================================================================================|
io.on('connection',function(socket){
    
    console.log("Un client s'est connecté");

    socket.emit('lampes',light);

    socket.emit('Chenillard',{on: objet.chenillard.on, speed: objet.chenillard.speed, sens: objet.chenillard.clockwise});

    fonction.init(socket,conf.ipAdresseHue, conf.hueUsername);


    socket.on('disconnection',function(socket){
        console.log("Un client s'est déconnecté");
    });

    socket.on('setlampe',function(data){
        if(objet.chenillard.on==true){
            objet.chenillard.changestate(io,fonction,light,connection);
        }
        fonction.setknx(connection,data.adresse, data.etat);
    });

    socket.on('sethue',function(data){
    var url = "http://"+conf.ipAdresseHue+'/api/'+conf.hueUsername+"/lights/"+data.lampe+"/state";
    var param = JSON.stringify({"on":data.on,"bri":data.bri,"sat":data.sat});
    var res = fonction.Put(url,param);
    var json = JSON.parse(res);
     if(json[0].success){
        fonction.init(socket,conf.ipAdresseHue,conf.hueUsername);
    }
    else{
        console.log("Erreur : La lampe " + data.lampe + " ne prend pas les paramètres : " + data+". Type de l'erreur : "+ json[0].error.description);
    }

    });

    socket.on('setCouleurHue',function(data){
        var lampe = data.lampe;
        var rgb = [data.r,data.g,data.b];
        var r=data.r;
        var g=data.g;
        var b = data.b;

        console.log("rgb : "+ rgb);;

        var url = "http://"+conf.ipAdresseHue+'/api/'+conf.hueUsername+"/lights/"+lampe+"/state";
        var param = JSON.stringify({"xy": [fonction.rgbToXyBri(r,g,b).x,fonction.rgbToXyBri(r,g,b).y],"bri" : Math.round(fonction.rgbToXyBri(r,g,b).bri) });

        console.log("xy : " +[fonction.rgbToXyBri(r,g,b).x,fonction.rgbToXyBri(r,g,b).y] + " bri : " + Math.round(fonction.rgbToXyBri(r,g,b).bri)); 
       console.log("r : " + fonction.xyBriToRgb({x:0.1,y:0.2,bri:0.6}).r + ", g : "+fonction.xyBriToRgb({x:0.1,y:0.2,bri:0.6}).g + ", b : "+fonction.xyBriToRgb({x:0.1,y:0.2,bri:0.6}).b);

        var res = fonction.Put(url,param);
        var json = JSON.parse(res);
        if(json[0].success){
              io.emit('changementCouleurHue',{numero:data.lampe,rgb:rgb});
              fonction.init(socket,conf.ipAdresseHue,conf.hueUsername);
        }

        else{
        console.log("Erreur lors du passage de la Hue 2 à la couleur"+data+". Type de l'erreur : "+ json[0].error.description);
        }

    });

    socket.on('setsens',function(data){
        objet.chenillard.clockwise=data;
    });

    socket.on('setspeed',function(vitesse){
       objet.chenillard.setspeed(io,vitesse); 
    });

    socket.on('setstate', function(){
        objet.chenillard.changestate(io,fonction,light,connection);

    });
});
      


//|===================================================================================|
//|============================== Lancement du server  ===============================|
//|===================================================================================|
http.listen(conf.portServer, function(){
  console.log('listening adresse : '+ipServer+ ' on : '+conf.portServer);
});

//|===================================================================================|
//|====================== Deconnection et shut down du server  =======================|
//|===================================================================================|

process.on('SIGINT', function(){
    if (connection.connected){
        console.log('deconnection du tunel');
        fonction.deconnectionknx(connection,function(){
            console.log('shut down server');
            process.exit();
        });
    }
    else{
        console.log('shut down server');
        process.exit();
    }
});

