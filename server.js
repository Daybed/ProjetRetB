//|===================================================================================|
//|============================== Ajout des frameworks ===============================|
//|===================================================================================|
var express = require('express'); 
var bodyParser = require('body-parser');
var app = express();
var http = require('http').Server(app);
var io= require('socket.io')(http);
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var xmlHttpGet = new XMLHttpRequest();
var xmlHttpPut = new XMLHttpRequest(); 
var fs = require("fs");
//a voir si on met en require ou on laisse en fs.readfilesync----------------------------------------------------------------------------??
//celui la je pense qu'il faut le laisser comme ca car ce ne sont pas des fonctions------------------------------------------------------------------
eval(fs.readFileSync(__dirname + '/objet.js')+'');

eval(fs.readFileSync(__dirname + '/function.js')+'');

eval(fs.readFileSync(__dirname + '/functions.js')+'');

app.use('/node_modules',express.static('C:/Users/Math/AppData/Roaming/npm/node_modules'));
app.use('/node_modules',express.static('C:/Users/Math/Desktop/JS/ProjetRetB/ProjetRetB-master/node_modules'));
app.use('/js',express.static(__dirname + '/js'));
app.use('/img',express.static(__dirname +'/img'));
app.use('/css',express.static(__dirname +'/css'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
//|===================================================================================|
//|==================== Déclaration/initialisation des variables =====================|
//|===================================================================================|
var endAugmenter;
var intervalUp;
var intervalDown;
var conf = JSON.parse(fs.readFileSync('conf.json'));
var ipserver=getIPAddress();
//|===================================================================================|
//|=================================== Module KNX ====================================|
//|===================================================================================|
KnxHelper = require('./src/KnxHelper.js');
KnxConnectionTunneling = require('./src/KnxConnectionTunneling.js');
exports.KnxHelper = KnxHelper;
exports.KnxConnectionTunneling = KnxConnectionTunneling;
var KnxConnectionTunneling = require('knx.js').KnxConnectionTunneling;
var connection = new KnxConnectionTunneling(conf.ipplateauknx, conf.portplateauknx,ipserver,conf.portserver );
//|===================================================================================|
//|============================= Initialisation Lampes================================|----------------------------------peut etre à supprimer et a placer avec le init() pour les hues ? 
//|===================================================================================|----------------------------------a tester quand on à la plaque 
//Lampes KNX
if (connection.connected){
    var light=[];
        for(var k =0; k<4;k++){
            light[k]={adresse:"0/1/"+k,etat:"", numero: k};
        }
}
// Pas terrible car on ne prévoit pas le rajout et la supression d'une lampe--------------------------------------------------avec la version du dessus on peut supprimer cette ligne ? 
var light = [{adresse:"0/1/1",etat:null,numero:1, nberreur:0},{adresse:"0/1/2",etat:null,numero:2, nberreur:0},{adresse:"0/1/3",etat:null,numero:3, nberreur:0},{adresse:"0/1/4",etat:null,numero:4, nberreur:0}];

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
    res.sendfile('/index.html', {
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
    });
}
//|===================================================================================|
//|============================= Socket avec le client ===============================|
//|===================================================================================|
io.on('connection',function(socket){
    
    console.log("Un client s'est connecté");
    
    socket.emit('lampes',light);
    socket.emit('init',{ipserver: ipserver, chenillardstate: chenillard.on, chenillardspeed: chenillard.speed});//---- préciser dans le socket que c'est KNX ou hue
    //--------------------------------------------------------------------------------------------ne faut il pas initialiser les lampe knx aussi ? 
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
        io.emit('ChangementOnHue',data);
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
        io.emit('ChangementBriHue',data);
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
        io.emit('ChangementSatHue',data);
        }
        else{
        console.log("Erreur lors du passage de la Hue " + data.lampe + " à la saturation " + data.sat+". Type de l'erreur : "+ json[0].error.description);
        }
    });

    socket.on('color',function(data){
        var url = "http://"+conf.ipAdresseHue+'/api/'+conf.hueUsername+"/lights/3/state";
        var r=data[0];
        var g=data[1];
        var b = data[2];
        var param = JSON.stringify({"xy": [rgbToXyBri(r,g,b).x,rgbToXyBri(r,g,b).y],"bri" : Math.round(rgbToXyBri(r,g,b).bri) });
 
        var res = Put(url,param);

        var json = JSON.parse(res);
        
        if(json[0].success){
            var tab=[];
            var rep = JSON.parse(Get('http://'+conf.ipAdresseHue+'/api/'+conf.hueUsername+'/lights/'));

            /*for(i in rep){
                if (rep[i].state.reachable==true){
                    var lampe = {lampe : i, on : rep[i].state.on, bri : rep[i].state.bri, xy: [rep[i].state.xy[0],rep[i].state.xy[1]], hue:rep[i].state.hue, sat:rep[i].state.sat};
                    tab.push(lampe);
                }
                else{
                }
            }*/
            
            for (i in rep){
                if (i==3){
                    var lampe = {lampe : i, on : rep[i].state.on, bri : rep[i].state.bri, xy: [rep[i].state.xy[0],rep[i].state.xy[1]], hue:rep[i].state.hue, sat:rep[i].state.sat};
                }
            }
            io.emit('ChangementColorHue',lampe);
         }

        else{
        console.log("Erreur lors du passage de la Hue 2 à la couleur"+data+". Type de l'erreur : "+ json[0].error.description);
        }

    });
});


//|===================================================================================|
//|============================== Lancement du server  ===============================|
//|===================================================================================|
http.listen(conf.portserver, function(){
  console.log('listening adresse : '+ipserver+ ' on : '+conf.portserver);
});
//|===================================================================================|
//|====================== Deconnection et shut down du server  =======================|
//|===================================================================================|
process.on('SIGINT', function(){
    if (connection.connected){
        console.log('deconnection du tunel');
        deconnectionknx(function(){
            console.log('shut down server');
            process.exit();
        });
    }
    else{
        console.log('shut down server');
        process.exit();
    }
});