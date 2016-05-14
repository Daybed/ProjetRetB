var conf=require("../conf.json");
var fonction= require("./fonction.js");
var chenillard= require("./chenillard.js");
var lastModeleEnclenché="";
//|===================================================================================|
//|================================== socket client ==================================|
//|===================================================================================|


var socketClient = function (io,mySocket,connection){

    io.on('connection',function(socket){
 
        console.log("Un client s'est connecté");

        socket.emit('lampes',fonction.light);

        socket.emit('Modeles',[]);
        //A FAIRE
        //Envoyer tous les modeles de la bdd
            
        socket.emit('Chenillard',{on: chenillard.on, speed: chenillard.speed, sens: chenillard.clockwise});

        fonction.initialisationHue(socket,mySocket);

        socket.emit('lastModeleEnclenché',lastModeleEnclenché);

        socket.on('disconnection',function(socket){
            console.log("Un client s'est déconnecté");
        });

        socket.on('setlampe',function(data){

            if(chenillard.on==true){
                chenillard.changestate(io,fonction,mySocket,connection);
            }
            fonction.setknx(connection,data.adresse, data.etat);
        });

        socket.on('sethue',function(data){

            var url = "http://"+conf.ipAdresseHue+'/api/'+conf.hueUsername+"/lights/"+data.lampe+"/state";
            var param = JSON.stringify({"on":data.on,"bri":data.bri,"sat":data.sat});
            var res = fonction.Put(url,param);
            var json = JSON.parse(res);
            if(json[0].success){
                fonction.initialisationHue(socket,mySocket);
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

            var url = "http://"+conf.ipAdresseHue+'/api/'+conf.hueUsername+"/lights/"+lampe+"/state";
            var param = JSON.stringify({"xy": [fonction.rgbToXyBri(r,g,b).x,fonction.rgbToXyBri(r,g,b).y],"bri" : Math.round(fonction.rgbToXyBri(r,g,b).bri) });
            var res = fonction.Put(url,param);
            var json = JSON.parse(res);
            if(json[0].success){
                fonction.initialisationHue(socket,mySocket);
            }
        });

        socket.on('setsens',function(data){

            chenillard.changeclockwise(io,mySocket,data);

        });

        socket.on('setspeed',function(vitesse){
           chenillard.setspeed(io,mySocket,vitesse); 
        });

        socket.on('setstate', function(){
            chenillard.changestate(io,fonction,mySocket,connection);

        });

        socket.on('NouveauModele',function(data){
           io.emit('nouveauModele',data);
           // A FAIRE

           //ajouter le nouveau modele à la bdd
           //Si nom existe dejà, envoyer un message aux clients
           //Sinon, envoyer aux clients tous les modeles  io.emit("Modeles",);
        });

         socket.on('modeleEnclenché',function(nom){
            io.emit('lastModeleEnclenché',lastModeleEnclenché);
            lastModeleEnclenché=nom;
        });

         socket.on('supprimerModele',function(nom){
            io.emit('modeleSupprimé',nom);
            // A FAIRE

        //supprimer le modele et renvoyer aux cliens tous les modeles io.emit("Modeles",);

         })

    });
}

//|===================================================================================|
//|================================== Listener KNK====================================|
//|===================================================================================|

var startDiminuer,endDiminuer;
var startAugmenter,endAugmenter;
var intervalUp,intervalDown;


var socketListenerKNX = function (io,connection,mySocket){

    connection.on('status', function(data, data1, data2) {
        console.log('status : L\'adresse '+data+" est a l'état : "+data1);
        if(data1==0 || data1==1){
            fonction.light[data[4]-1].etat=data1;
        }
        else if(data1!=0 && data1!=1 && fonction.light[data[4]-1].nberreur<10){
            fonction.getknx(connection,data);
            fonction.light[data[4]-1].nberreur++;
        }

    }); 

    connection.on('event', function(data, data1, data2) {
        console.log('event : L\'adresse '+data+" est a l'état : "+data1);
        if(data[0]==0){
            fonction.light[data[4]-1].etat=data1;
            io.emit('lampes',fonction.light);
        }
        else if(data[0]==1){    
            if(data1==1){
                if(data[4]==1){
                    chenillard.changestate(io,fonction,mySocket,connection);
                }
                else if(data[4]==2){
                    chenillard.changeclockwise(io,mySocket);
                }
                else if(data[4]==3){
                    startDiminuer = new Date().getTime();
                    intervalDown = setInterval(function(){chenillard.setspeed(io,mySocket,chenillard.speed+10);},100);
                }
                else if(data[4]==4){
                    startAugmenter = new Date().getTime();
                    intervalUp = setInterval(function(){chenillard.setspeed(io,mySocket,chenillard.speed-10);},100);
                }
            }
            else if(data1==0){
                if(data[4]==3){
                    endDiminuer = new Date().getTime();
                    clearInterval(intervalDown);
                    if((endDiminuer-startDiminuer)<100){
                        chenillard.setspeed(io,mySocket,chenillard.speed+100);
                    }
                }
                else if(data[4]==4){
                    endAugmenter = new Date().getTime();
                    clearInterval(intervalUp);
                    if((endAugmenter-startAugmenter)<100){
                        chenillard.setspeed(io,mySocket,chenillard.speed-100);
                    }
                }
            }        
        }
    });
} 

//|===================================================================================|
//|========================================= Emit ====================================|
//|===================================================================================|

var socketEmitChenillard = function(io){
    io.emit('Chenillard',{on : chenillard.on, speed: chenillard.speed, sens: chenillard.clockwise});
}
var socketInitHue = function(io,hue){
     io.emit('Hue',hue);
}

//|===================================================================================|
//|============================= Exports des fonctions utiles ========================|
//|===================================================================================|

exports.socketClient=socketClient;
exports.socketListenerKNX=socketListenerKNX;
exports.socketEmitChenillard=socketEmitChenillard;
exports.socketInitHue=socketInitHue;
