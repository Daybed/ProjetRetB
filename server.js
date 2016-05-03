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
var funct= require("./js/function.js");

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
var ipServer=funct.getIPAddress();
//|===================================================================================|
//|=================================== Module KNX ====================================|
//|===================================================================================|
KnxHelper = require('./src/KnxHelper.js');
KnxConnectionTunneling = require('./src/KnxConnectionTunneling.js');
exports.KnxHelper = KnxHelper;
exports.KnxConnectionTunneling = KnxConnectionTunneling;
var KnxConnectionTunneling = require('knx.js').KnxConnectionTunneling;
var connection = new KnxConnectionTunneling(conf.ipPlateauknx, conf.portPlateauknx,ipServer,conf.portServer );
console.log(connection);
//|===================================================================================|
//|============================= Initialisation Lampes================================|----------------------------------peut etre à supprimer et a placer avec le init() pour les hues ? 
//|===================================================================================|----------------------------------a tester quand on à la plaque 
//Lampes KNX
var light=[];
if (connection.connected){
        for(var k =1; k<5;k++){
            light[k]={adresse:"0/1/"+k,etat:null, numero: k,nberreur:0};
        }
}


// Pas terrible car on ne prévoit pas le rajout et la supression d'une lampe--------------------------------------------------avec la version du dessus on peut supprimer cette ligne ? 
//var light = [{adresse:"0/1/1",etat:null,numero:1, nberreur:0},{adresse:"0/1/2",etat:null,numero:2, nberreur:0},{adresse:"0/1/3",etat:null,numero:3, nberreur:0},{adresse:"0/1/4",etat:null,numero:4, nberreur:0}];

//connectionknx(function(){getall();});---------------------------------------------------------------------------------------------c'est quoi ?

//|===================================================================================|
//|================================== A m'expliquer===================================|------------------------------------------------------
//|===================================================================================|
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
if (connection.connected){
    connection.on('status', function(data, data1, data2) {
        console.log('status : L\'adresse '+data+" est a l'état : "+data1);

        if(data1==0 || data1==1){
        light[data[4]-1].etat=data1;
        }
        else if(data1!=0 && data1!=1 && light[data[4]-1].nberreur<10){
        getknx(data);
        light[data[4]-1].nberreur++;
        
        }
        else if(data1!=0 && data1!=1 && light[data[4]-1].nberreur>=10){
        light[data[4]-1].etat=data1;
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
                objet.chenillard.changestate(funct,light);
                io.emit('etat chenillard',chenillard.on);
                }
                else if(data[4]==2){
                objet.chenillard.changeclockwise();
                }
                else if(data[4]==3){
                startDiminuer = new Date().getTime();
                intervalDown = setInterval(function(){objet.chenillard.setspeed(objet.chenillard.speed+10);},100);
                }
                else if(data[4]==4){
                startAugmenter = new Date().getTime();
                intervalUp = setInterval(function(){objet.chenillard.setspeed(chenillard.speed-10);},100);
                 }
             }
            else if(data1==0){
                if(data[4]==3){
                    endDiminuer = new Date().getTime();
                    clearInterval(intervalDown);
                    if((endDiminuer-startDiminuer)<100){
                        objet.chenillard.setspeed(objet.chenillard.speed+100);
                    }
                }
                else if(data[4]==4){
                    endAugmenter = new Date().getTime();
                    clearInterval(intervalUp);
                    if((endAugmenter-startAugmenter)<100){
                        objet.chenillard.setspeed(objet.chenillard.speed-100);
                    }
                }
            }        
        }
    });
}

//|===================================================================================|
//|============================= Socket avec le client ===============================|
//|===================================================================================|
io.on('connection',function(socket){
    
    console.log("Un client s'est connecté");
    
    socket.emit('lampes',light);

    socket.emit('init',{ipserver: ipServer, chenillardstate: objet.chenillard.on, chenillardspeed: objet.chenillard.speed});//---- préciser dans le socket que c'est KNX ou hue
    //--------------------------------------------------------------------------------------------ne faut il pas initialiser les lampe knx aussi ? 

   // init(socket);

    socket.on('setspeed',function(vitesse){
       objet.chenillard.setspeed(vitesse); 
       console.log("Vitesse actuelle : " + vitesse);
    });

    socket.on('changedirection',function(){
        objet.chenillard.changeclockwise();
    });

    socket.on('changestate', function(){
        objet.chenillard.changestate(funct,light);
        io.emit('etat chenillard',objet.chenillard.on);
    });

    socket.on('disconnection',function(socket){
        console.log("Un client s'est déconnecté");
    });

    socket.on('setlampe',function(data){
        if(objet.chenillard.on==true){
            objet.chenillard.changestate(funct,light);
        }
        io.emit('etat chenillard',objet.chenillard.on);
        funct.setknx(data.adresse, data.etat);
    });


    socket.on('on',function(data){
        var url = "http://"+conf.ipAdresseHue+'/api/'+conf.hueUsername+"/lights/"+data.lampe+"/state";
        var param = JSON.stringify({"on":data.on});
        var res = Put(url,param);
        var json = JSON.parse(res);
       if(json[0].success){
        //io.emit('ChangementOnHue',data);
        funct.init(socket,conf.ipAdresseHue,conf.hueUsername);
        }
        else{
        console.log("Erreur lors du passage de la Hue " + data.lampe + " à l'état " + data.on+". Type de l'erreur : "+ json[0].error.description);
        }
    });

    

    socket.on('bri',function(data){
        var url = "http://"+conf.ipAdresseHue+'/api/'+conf.hueUsername+"/lights/"+data.lampe+"/state";
        var param = JSON.stringify({"bri":data.bri});

        var res = Put(url,param);
        
        var json = JSON.parse(res);
       if(json[0].success){
        // io.emit('ChangementBriHue',data);
        funct.init(socket,conf.ipAdresseHue,conf.hueUsername);
        }
        else{
        console.log("Erreur lors du passage de la Hue " + data.lampe + " à la lum " + data.bri+". Type de l'erreur : "+ json[0].error.description);
        }
    });


    socket.on('sat',function(data){
        var url = "http://"+conf.ipAdresseHue+'/api/'+conf.hueUsername+"/lights/"+data.lampe+"/state";
        var param = JSON.stringify({"sat":data.sat});
        var res = Put(url,param);

        var json = JSON.parse(res);
       if(json[0].success){
       // io.emit('ChangementSatHue',data);
      funct.init(socket,conf.ipAdresseHue,conf.hueUsername);
       }

        else{
        console.log("Erreur lors du passage de la Hue " + data.lampe + " à la saturation " + data.sat+". Type de l'erreur : "+ json[0].error.description);
        }
    });

    socket.on('color',function(data){
        var lampe = data.lampe;
        var r=data.r;
        var g=data.g;
        var b = data.b;
        var url = "http://"+conf.ipAdresseHue+'/api/'+conf.hueUsername+"/lights/"+lampe+"/state";
        var param = JSON.stringify({"xy": [rgbToXyBri(r,g,b).x,rgbToXyBri(r,g,b).y],"bri" : Math.round(rgbToXyBri(r,g,b).bri) });
        var res = Put(url,param);
        var json = JSON.parse(res);
        
        if(json[0].success){
              funct.init(socket,conf.ipAdresseHue,conf.hueUsername);
        }

        else{
        console.log("Erreur lors du passage de la Hue 2 à la couleur"+data+". Type de l'erreur : "+ json[0].error.description);
        }

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
        funct.deconnectionknx(function(){
            console.log('shut down server');
            process.exit();
        });
    }
    else{
        console.log('shut down server');
        process.exit();
    }
});

