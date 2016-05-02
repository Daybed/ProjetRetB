var somme =0;
var k;
var newtab=[{etat:false},{etat:false},{etat:false},{etat:false}];
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var xmlHttpGet = new XMLHttpRequest();
var xmlHttpPut = new XMLHttpRequest(); 
module.exports ={


    initHue : function(callback,ip,user){
      var tab=[];
      var rep = this.Get('http://'+ip+'/api/'+user+'/lights/');

      if (rep!='error'){
        rep=JSON.parse(rep);
        for(i in rep){
            if (rep[i].state.reachable==true){
                var lampe = {lampe : i, on : rep[i].state.on, bri : rep[i].state.bri, xy: [rep[i].state.xy[0],rep[i].state.xy[1]], hue:rep[i].state.hue, sat:rep[i].state.sat};
                tab.push(lampe);
            }
        }
        
      }
      callback(tab);

    },

    init : function (socket,ip,user){
      this.initHue(function(hue){
        if (hue!=[]){
           socket.emit('initHue',hue);
        }
        else{
          console.log('oui');
        }
      },ip,user);
    },


    Get:function (url) {
        xmlHttpGet.open( "GET", url , false ); 
        xmlHttpGet.send( null );
            if(xmlHttpGet.status==200){
                return xmlHttpGet.responseText;
            }
            else{
              return 'error';
            }
    },

    Put:function (url,paramASend){
      xmlHttpPut.open("PUT", url, false ); 
      xmlHttpPut.send(paramASend);
        if(xmlHttpPut.status==200){
          return xmlHttpPut.responseText;
        }
    },

    getIPAddress: function () {
      var interfaces = require('os').networkInterfaces();
      for (var devName in interfaces) {
        var iface = interfaces[devName];

        for (var i = 0; i < iface.length; i++) {
          var alias = iface[i];
          if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal)
            return alias.address;
        }
      }
      return '0.0.0.0';
    },


    getall:function (){
      for(var i in light){
        getknx(light[i].adresse);
      }
    } ,
    connectionknx : function (callback){
      connection.Connect(function (){callback();});
    },
    deconnectionknx:function (callback){
      connection.Disconnect(function(){callback();});
    },
    setknx:function (adresse,value){
      connection.Action(adresse,value);
    },
    getknx:function (adresse){
      connection.RequestStatus(adresse);
    },


    exec:function (callback){

          if(objet.chenillard.clockwise==true){

                  for (var j=0; j<light.length;j++){

                   k = (j+1+light.length) % light.length;
                   somme+=light[j].etat;

                      if(light[j].etat==1){
                        newtab[k].etat=true;
                      }
                      else{
                        newtab[k].etat=false;
                      }
                    }
                  }

            else if(objet.chenillard.clockwise==false){

                for (var j=0; j<light.length;j++){

                  k = (j-1+light.length) % light.length;
                  somme+=light[j].etat;

                  if(light[j].etat==1){
                    newtab[k].etat=true;
                  }
                  else{
                      newtab[k].etat=false;
                    }
                    
                }
              }


            if(somme==light.length || somme==0){
              console.log("Pas d'action à effectuer, lampes toute allumées ou lampes toute éteintes");
              //toast
            }
            
            else if(objet.chenillard.on==true){
                for(var i in newtab){
                  setknx(light[i].adresse,newtab[i].etat);
                }
            }

            else{
              console.log("Erreur");
            }

            somme = 0;
            callback();
    },

    looptest:function  (){

        if(objet.chenillard.on==true){
          exec(function(){
          setTimeout(function(){
            looptest();}, objet.chenillard.speed
          );
        });
        }
        else{
          return;
        }
    },


    rgbToXyBri:function (Red,Green,Blue) {
        var red = Red/255;;
        var green = Green/255;
        var blue = Blue/255;
        var r = (red > 0.04045) ? Math.pow((red + 0.055) / (1.0 + 0.055), 2.4) : (red / 12.92);
        var g = (green > 0.04045) ? Math.pow((green + 0.055) / (1.0 + 0.055), 2.4) : (green / 12.92);
        var b = (blue > 0.04045) ? Math.pow((blue + 0.055) / (1.0 + 0.055), 2.4) : (blue / 12.92);
        var X = r * 0.649926 + g * 0.103455 + b * 0.197109;
        var Y = r * 0.234327 + g * 0.743075 + b * 0.022598;
        var Z = r * 0.0000000 + g * 0.053077 + b * 1.035763;
        var cx = X / (X + Y + Z);
        var cy = Y / (X + Y + Z);
        if (isNaN(cx)) {
            cx = 0.0;
        }
        if (isNaN(cy)) {
            cy = 0.0;
        }
        return {
              x: cx,
              y: cy,
              bri: Y*255
          };
    }
    

}