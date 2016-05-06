//|===================================================================================|
//|================================== socket client ==================================|
//|===================================================================================|

var socketClient = function (io,fonction,chenillard,conf,light){

    io.on('connection',function(socket){
        console.log("Un client s'est connecté");

        socket.emit('lampes',light);

        socket.emit('Chenillard',{on: chenillard.on, speed: chenillard.speed, sens: chenillard.clockwise});

        fonction.initialisationHue(socket,conf.ipAdresseHue, conf.hueUsername);

        socket.on('disconnection',function(socket){
            console.log("Un client s'est déconnecté");
        });

        socket.on('setlampe',function(data){
            if(chenillard.on==true){
                chenillard.changestate(io,fonction,chenillard,socket,connection,light);
            }
            fonction.setknx(connection,data.adresse, data.etat);
        });

        socket.on('hue',function(data){
            var url = "http://"+conf.ipAdresseHue+'/api/'+conf.hueUsername+"/lights/"+data.lampe+"/state";
            var param = JSON.stringify({"on":data.on,"bri":data.bri,"sat":data.sat});
            var res = Put(url,param);
            var json = JSON.parse(res);
            if(json[0].success){
                fonction.initialisationHue(socket,conf.ipAdresseHue,conf.hueUsername);
            }
            else{
                console.log("Erreur : La lampe " + data.lampe + " ne prend pas les paramètres : " + data+". Type de l'erreur : "+ json[0].error.description);
            }
        });

        socket.on('color',function(data){
            var lampe = data.lampe;
            var r=data.r;
            var g=data.g;
            var b = data.b;
            var url = "http://"+conf.ipAdresseHue+'/api/'+conf.hueUsername+"/lights/"+lampe+"/state";
            var param = JSON.stringify({"xy": [fonction.rgbToXyBri(r,g,b).x,fonction.rgbToXyBri(r,g,b).y],"bri" : Math.round(fonction.rgbToXyBri(r,g,b).bri) });
            var res = Put(url,param);
            var json = JSON.parse(res);
            if(json[0].success){
                fonction.initialisationHue(socket,conf.ipAdresseHue,conf.hueUsername);
            }
            else{
                console.log("Erreur lors du passage de la Hue 2 à la couleur"+data+". Type de l'erreur : "+ json[0].error.description);
            }

        });

        socket.on('setsens',function(data){
            chenillard.clockwise=data;
        });

        socket.on('setspeed',function(vitesse){
           chenillard.setspeed(io,socket,vitesse); 
        });

        socket.on('setstate', function(){
            chenillard.changestate(io,fonction,chenillard,socket,connection,light);

        });
    });
}

//|===================================================================================|
//|================================== Listener KNK====================================|
//|===================================================================================|

var startDiminuer,endDiminuer;
var startAugmenter,endAugmenter;
var intervalUp,intervalDown;

var socketListenerKNX = function (io,fonction,chenillard,connection,light){

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
                    chenillard.changestate(io,fonction,chenillard,socket,connection,light);
                }
                else if(data[4]==2){
                    chenillard.changeclockwise(io,socket);
                }
                else if(data[4]==3){
                    startDiminuer = new Date().getTime();
                    intervalDown = setInterval(function(){chenillard.setspeed(io,socket,chenillard.speed+10);},100);
                }
                else if(data[4]==4){
                    startAugmenter = new Date().getTime();
                    intervalUp = setInterval(function(){chenillard.setspeed(io,socket,chenillard.speed-10);},100);
                }
            }
            else if(data1==0){
                if(data[4]==3){
                    endDiminuer = new Date().getTime();
                    clearInterval(intervalDown);
                    if((endDiminuer-startDiminuer)<100){
                        chenillard.setspeed(io,socket,chenillard.speed+100);
                    }
                }
                else if(data[4]==4){
                    endAugmenter = new Date().getTime();
                    clearInterval(intervalUp);
                    if((endAugmenter-startAugmenter)<100){
                        chenillard.setspeed(io,socket,chenillard.speed-100);
                    }
                }
            }        
        }
    });
} 
//|===================================================================================|
//|========================================= Emit ====================================|
//|===================================================================================|

var socketEmitChenillard = function(io,chenillard){
    console.log(chenillard.speed);
    io.emit('Chenillard',{on : chenillard.on, speed: chenillard.speed, sens: chenillard.clockwise});
}








//|===================================================================================|
//|============================= Exports des fonctions utiles ========================|
//|===================================================================================|

exports.socketClient=socketClient;
exports.socketListenerKNX=socketListenerKNX;
exports.socketEmitChenillard=socketEmitChenillard;
