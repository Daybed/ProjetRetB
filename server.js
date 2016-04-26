var express = require('express'); 
var bodyParser = require('body-parser');
var app = express();
var fs = require("fs");
var http = require('http').Server(app);
var io= require('socket.io')(http);

// charger l'adresse ip des hue avec le lien :https://www.meethue.com/api/nupnp
    
eval(fs.readFileSync(__dirname + '/js/function.js')+'');
eval(fs.readFileSync(__dirname + '/js/objet.js')+'');
app.use('/node_modules',express.static('d:/Documents/David/Javascript/ProjetRetB/node_modules'));
app.use('/public',express.static(__dirname + '/public'));
app.use('/bower_components',express.static(__dirname + '/bower_components'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var ipserver=getIPAddress();
var ipplateauknx= '192.168.1.117';
var portplateauknx=3671;
var portserver = 13671;

var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var xmlHttpGet = new XMLHttpRequest();
var xmlHttpPut = new XMLHttpRequest(); 

var endAugmenter;
var intervalUp;
var intervalDown;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//module et param pour knx
KnxHelper = require('./src/KnxHelper.js');
KnxConnectionTunneling = require('./src/KnxConnectionTunneling.js');
exports.KnxHelper = KnxHelper;
exports.KnxConnectionTunneling = KnxConnectionTunneling;

//crée les variables de connexion à la plaque KNX
var KnxConnectionTunneling = require('knx.js').KnxConnectionTunneling;
var connection = new KnxConnectionTunneling(ipplateauknx, portplateauknx,ipserver,portserver );

// Pas terrible car on ne prévoit pas le rajout et la supression d'une lampe
var light = [{adresse:"0/1/1",etat:null,numero:1, nberreur:0},{adresse:"0/1/2",etat:null,numero:2, nberreur:0},{adresse:"0/1/3",etat:null,numero:3, nberreur:0},{adresse:"0/1/4",etat:null,numero:4, nberreur:0}];

//connectionknx(function(){getall();});

var conf = JSON.parse(fs.readFileSync('conf.json'));

// adresse ip serveur hue : https://www.meethue.com/api/nupnp


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

// affichage de la page 
app.all('/', function(req, res) {
    res.sendFile('/index.html', {
        root: __dirname
    });
});

//listener 
/*
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
            chenillard.changestate();
            io.emit('etat chenillard',chenillard.on);
            }
            else if(data[4]==2){
            chenillard.changeclockwise();
            }
            else if(data[4]==3){
            startDiminuer = new Date().getTime();
            intervalDown = setInterval(function(){chenillard.setspeed(chenillard.speed+10);},100);
            }
            else if(data[4]==4){
            startAugmenter = new Date().getTime();
            intervalUp = setInterval(function(){chenillard.setspeed(chenillard.speed-10);},100);
             }
         }

        else if(data1==0){

            if(data[4]==3){
                endDiminuer = new Date().getTime();
                clearInterval(intervalDown);
                if((endDiminuer-startDiminuer)<100){
                    chenillard.setspeed(chenillard.speed+100);
                }
            }
            else if(data[4]==4){
                endAugmenter = new Date().getTime();
                clearInterval(intervalUp);
                if((endAugmenter-startAugmenter)<100){
                    chenillard.setspeed(chenillard.speed-100);
                }
            }
        }        
    }
});*/


io.on('connection',function(socket){
    
    console.log("Un client s'est connecté");
    
    socket.emit('lampes',light);
    socket.emit('init',{ipserver: ipserver, chenillardstate: chenillard.on, chenillardspeed: chenillard.speed});
    init(socket);

    socket.on('setspeed',function(vitesse){
       chenillard.setspeed(vitesse); 
       console.log("Vitesse actuelle : " + vitesse);
    });

    socket.on('changedirection',function(){
    chenillard.changeclockwise();
    });

    socket.on('changestate', function(){
        chenillard.changestate();
        io.emit('etat chenillard',chenillard.on);
    });

    socket.on('disconnection',function(socket){
        console.log("Un client s'est déconnecté");
    });

    socket.on('setlampe',function(data){
        if(chenillard.on==true){
            chenillard.changestate();
        }
        io.emit('etat chenillard',chenillard.on);
        setknx(data.adresse, data.etat);
    });


    socket.on('on',function(data){
        var url = "http://"+conf.ipAdresseHue+'/api/'+conf.hueUsername+"/lights/"+data.lampe+"/state";
        var param = JSON.stringify({"on":data.on});
        var res = Put(url,param);
        var json = JSON.parse(res);
       if(json[0].success){
        //io.emit('ChangementOnHue',data);
        init(socket);
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
        init(socket);
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
       init(socket);
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
        var param = JSON.stringify({"xy": [rgb2xy(r,g,b).x,rgb2xy(r,g,b).y]});
        var res = Put(url,param);
        var json = JSON.parse(res);
        
       if(json[0].success){
        init(socket);
         }

        else{
        console.log("Erreur lors du passage de la Hue 2 à la couleur"+data+". Type de l'erreur : "+ json[0].error.description);
        }

    });
});
      

    
http.listen(8000, function(){
  console.log('listening adresse : '+ipserver+ ' on :8000');
});


//permet la fermeture du tunel lorsque l'on fait CRL + C

process.on('SIGINT', function(){
  console.log('deconnection du tunel');
//  deconnectionknx(function(){
    process.exit();
});
//})
