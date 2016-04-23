var express = require('express'); 
var bodyParser = require('body-parser');
var app = express();
var fs = require("fs");
var http = require('http').Server(app);
var io= require('socket.io')(http);


eval(fs.readFileSync(__dirname + '/function.js')+'');
eval(fs.readFileSync(__dirname + '/objet.js')+'');
app.use('/node_modules',express.static('d:/Documents/David/Javascript/node_modules'));
app.use('/node_modules',express.static('d:/Documents/David/Javascript/ProjetRetB/node_modules'));
app.use('/js',express.static(__dirname + '/js'));
app.use('/img',express.static(__dirname +'/img'));
app.use('/css',express.static(__dirname +'/css'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var ipserver=getIPAddress();
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var xmlHttpGet = new XMLHttpRequest();
var xmlHttpPut = new XMLHttpRequest(); 
var endAugmenter;
var intervalUp;
var intervalDown;

var ipplateauknx= '192.168.1.117';
var portplateauknx=3671;
    
var portserver = 13671;

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

/*

var light=[];
for(var k =0; k<4;k++){
light[k]={adresse:"0/1/"+k,etat:"", numero: k};
}*/

// Pas terrible car on ne prévoit pas le rajout et la supression d'une lampe
var light = [{adresse:"0/1/1",etat:null,numero:1, nberreur:0},{adresse:"0/1/2",etat:null,numero:2, nberreur:0},{adresse:"0/1/3",etat:null,numero:3, nberreur:0},{adresse:"0/1/4",etat:null,numero:4, nberreur:0}];

//connectionknx(function(){getall();});

//lancement de la connection 
var conf = JSON.parse(fs.readFileSync('conf.json'));

function initHue(callback){
    var tab=[];
    var rep = JSON.parse(Get('http://'+conf.ipAdresseHue+'/api/'+conf.hueUsername+'/lights/'));

    for(i in rep){
        if (rep[i].state.reachable==true){
            var lampe = {lampe : i, on : rep[i].state.on, bri : rep[i].state.bri, xy: [rep[i].state.xy[0],rep[i].state.xy[1]], hue:rep[i].state.hue, sat:rep[i].state.sat};
            tab.push(lampe);
        }
        else{
        }
    }
    console.log(tab);
    callback(tab);
};

function init(socket){
initHue(function(hue){
socket.emit('initHue',hue);
});
}


function Get(url) {
    xmlHttpGet.open( "GET", url , false ); 
    xmlHttpGet.send( null );
        if(xmlHttpGet.status==200){
            return xmlHttpGet.responseText;
        }
}

function Put(url,paramASend){
    xmlHttpPut.open("PUT", url, false ); 
    xmlHttpPut.send(paramASend);
        if(xmlHttpPut.status==200){
            return xmlHttpPut.responseText;
        }
}


//color(24,154,2);

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
    res.sendfile('/index.html', {
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
    //init(socket);

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
        var url = "http://"+conf.ipAdresseHue+'/api/'+conf.hueUsername+"/lights/2/state";
        var r=data[0];
        var g=data[1];
        var b = data[2];
       // console.log(rgb2hsl(r,g,b).sat + " et " + rgb2hsl(r,g,b).bri +'\n' + rgb2hsv(r,g,b).s + " et "+rgb2hsv(r,g,b).v);
        //var param = JSON.stringify({"xy": [rgb2xy(r,g,b).x,rgb2xy(r,g,b).y],"sat":rgb2hsl(r,g,b).sat,"bri":rgb2hsl(r,g,b).bri});
        var res = Put(url,param);
        var json = JSON.parse(res);
        
        if(json[0].success){
            var tab=[];
            var rep = JSON.parse(Get('http://'+conf.ipAdresseHue+'/api/'+conf.hueUsername+'/lights/'));

            for(i in rep){
                if (rep[i].state.reachable==true){
                    var lampe = {lampe : i, on : rep[i].state.on, bri : rep[i].state.bri, xy: [rep[i].state.xy[0],rep[i].state.xy[1]], hue:rep[i].state.hue, sat:rep[i].state.sat};
                    tab.push(lampe);
                }
                else{
                }
            }
            io.emit('ChangementColorHue',tab);
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
/*{
  "ipAdresseHue" : "192.168.1.104",
  "hueUsername" : "c45537a1ec1feb75b4b4e61605fd3",
  "portServer" : "5000",
  "name":"test"
}*/