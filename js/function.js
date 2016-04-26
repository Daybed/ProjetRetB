var somme =0;
var k;
var newtab=[{etat:false},{etat:false},{etat:false},{etat:false}];
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

 function getIPAddress() {
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
}


  function getall(){
    for(var i in light){
    getknx(light[i].adresse);
}
  } 
  function connectionknx(callback){
    connection.Connect(function (){callback();});
  }
  function deconnectionknx(callback){
    connection.Disconnect(function(){callback();});
  }
  function setknx(adresse,value){
    connection.Action(adresse,value);
  }
  function getknx(adresse){
    connection.RequestStatus(adresse);
  }


function exec(callback){

      if(chenillard.clockwise==true){

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

        else if(chenillard.clockwise==false){

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
        
        else if(chenillard.on==true){
            for(var i in newtab){
              setknx(light[i].adresse,newtab[i].etat);
            }
        }

        else{
          console.log("Erreur");
        }

        somme = 0;
        callback();
}

function looptest (){

    if(chenillard.on==true){
      exec(function(){
      setTimeout(function(){
        looptest();}, chenillard.speed
      );
    });
    }
    else{
      return;
    }
}


function rgbToXyBri(Red,Green,Blue) {
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
/*
function rgb2xy(R,G,B){

  var X = 0.4124*R + 0.3576*G + 0.1805*B;
  var Y = 0.2126*R + 0.7152*G + 0.0722*B;
  var Z = 0.0193*R + 0.1192*G + 0.9505*B;
  var coorx = X / (X + Y + Z);
  var coory = Y / (X + Y + Z);
  return {x:coorx,y:coory};

}

function rgb2hsl (r,g,b) {
  var r1=r/255;
  var g1=g/255;
  var b1=b/255;
 var minRGB = Math.min(r1,Math.min(g1,b1));
 var maxRGB = Math.max(r1,Math.max(g1,b1));
 var delta=maxRGB-minRGB;
 var l;
 var s;
 l = (minRGB + maxRGB)/2;
 if(delta==0){
   s = 0;
}
else{
  s = delta/(1-(Math.abs(2*l -1)));
}
s= Math.round(s*255);
l = Math.round(l*255);
return {sat:s,bri:l};
}

function rgb2hsv (r,g,b) {
 var computedH = 0;
 var computedS = 0;
 var computedV = 0;

 //remove spaces from input RGB values, convert to int
 var r = parseInt( (''+r).replace(/\s/g,''),10 ); 
 var g = parseInt( (''+g).replace(/\s/g,''),10 ); 
 var b = parseInt( (''+b).replace(/\s/g,''),10 ); 

 if ( r==null || g==null || b==null ||
     isNaN(r) || isNaN(g)|| isNaN(b) ) {
   alert ('Please enter numeric RGB values!');
   return;
 }
 if (r<0 || g<0 || b<0 || r>255 || g>255 || b>255) {
   alert ('RGB values must be in the range 0 to 255.');
   return;
 }
 r=r/255; g=g/255; b=b/255;
 var minRGB = Math.min(r,Math.min(g,b));
 var maxRGB = Math.max(r,Math.max(g,b));

 // Black-gray-white
 if (minRGB==maxRGB) {
  computedV = minRGB;
  return [0,0,computedV];
 }

 // Colors other than black-gray-white:
 var d = (r==minRGB) ? g-b : ((b==minRGB) ? r-g : b-r);
 var h = (r==minRGB) ? 3 : ((b==minRGB) ? 1 : 5);
 computedH = 60*(h - d/(maxRGB - minRGB));
 computedS = Math.round(((maxRGB - minRGB)/maxRGB)*255);
 computedV = Math.round(maxRGB*255);


 return {h:computedH,s:computedS,v:computedV};
}

*/