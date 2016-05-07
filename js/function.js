var somme =0;
var k;
var newtab=[{etat:false},{etat:false},{etat:false},{etat:false}];
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var xmlHttpGet = new XMLHttpRequest();
var xmlHttpPut = new XMLHttpRequest(); 
var objet = require("./objet.js");

module.exports ={


    initHue : function(callback,ip,user){
      var hue=[];
      var rep = this.Get('http://'+ip+'/api/'+user+'/lights/');
      if (rep!='error'){
        rep=JSON.parse(rep);
        for(i in rep){
            if (rep[i].state.reachable==true){
                var lampe = {lampe : i, on : rep[i].state.on, bri : rep[i].state.bri, xy: [rep[i].state.xy[0],rep[i].state.xy[1]], hue:rep[i].state.hue, sat:rep[i].state.sat};
                hue.push(lampe);
            }
        }
        
      }
      callback(hue);
    },

    init : function (socket,ip,user){
      this.initHue(function(hue){
        if (hue!=[]){
           socket.emit('Hue',hue);
        }
        else{
          console.log('tableau hue vide');
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


    getall:function (connection,light){
      for(var i in light){
        this.getknx(connection,light[i].adresse);
      }
    } ,
    connectionknx : function (connection,callback){
      connection.Connect(function(){callback();});
    },
    deconnectionknx:function (connection,callback){
      connection.Disconnect(function(){callback();});
    },
    setknx:function (connection,adresse,value){
      connection.Action(adresse,value);
    },
    getknx:function (connection,adresse){
     connection.RequestStatus(adresse);
    
    },


    exec:function (connection,callback,light){

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
            }
            
            else if(objet.chenillard.on==true){
                for(var i in newtab){
                  this.setknx(connection,light[i].adresse,newtab[i].etat);
                }
            }

            else{
              console.log("Erreur");
            }

            somme = 0;
            callback();
    },

    looptest : function(connection,light){
        if(objet.chenillard.on==true){
          this.exec(connection,function(){
          setTimeout(function(){
            module.exports.looptest(connection,light);}, objet.chenillard.speed
            );
        },light);
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
    },

      xyBriToRgb: function(xyb) {
      if (0 > xyb.x || xyb.x > .8) {
          throw 'x property must be between 0 and .8, but is: ' + xyb.x;
      }
      if (0 > xyb.y || xyb.y > 1) {
          throw 'y property must be between 0 and 1, but is: ' + xyb.y;
      }
      if (0 > xyb.bri || xyb.bri > 1) {
          throw 'bri property must be between 0 and 1, but is: ' + xyb.bri;
      }
      var x = xyb.x;
      var y = xyb.y;
      var z = 1.0 - x - y;
      var Y = xyb.bri;
      var X = (Y / y) * x;
      var Z = (Y / y) * z;
      var r = X * 1.612 - Y * 0.203 - Z * 0.302;
      var g = -X * 0.509 + Y * 1.412 + Z * 0.066;
      var b = X * 0.026 - Y * 0.072 + Z * 0.962;
      r = r <= 0.0031308 ? 12.92 * r : (1.0 + 0.055) * Math.pow(r, (1.0 / 2.4)) - 0.055;
      g = g <= 0.0031308 ? 12.92 * g : (1.0 + 0.055) * Math.pow(g, (1.0 / 2.4)) - 0.055;
      b = b <= 0.0031308 ? 12.92 * b : (1.0 + 0.055) * Math.pow(b, (1.0 / 2.4)) - 0.055;
      var cap = function(x) {
          return Math.max(0, Math.min(1, x));
      };
      return {
          r: cap(r),
          g: cap(g),
          b: cap(b)
      }   

}

};