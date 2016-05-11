var conf=require("../conf.json");
var chenillard= require("./chenillard.js");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var xmlHttpGet = new XMLHttpRequest();
var xmlHttpPut = new XMLHttpRequest(); 
var somme =0;
var k;
var newtab=[{etat:false},{etat:false},{etat:false},{etat:false}];
var light=[{adresse:"0/1/1",etat:"error", numero: 1,nbessai:0},{adresse:"0/1/2",etat:"error", numero: 2,nbessai:0},{adresse:"0/1/3",etat:"error", numero: 3,nbessai:0},{adresse:"0/1/4",etat:"error", numero: 4,nbessai:0}];
//|===================================================================================|
//|======================= Detection de l'adresse ip du serveur ======================|
//|===================================================================================|
var	getIpAddress = function () {
	var interfaces = require('os').networkInterfaces();
	for (var devName in interfaces) {
		var iface = interfaces[devName];

		for (var i = 0; i < iface.length; i++) {
			var alias = iface[i];
			if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal){
				return alias.address;
			}
		}
	}
	return '0.0.0.0';
}
//|===================================================================================|
//|================================== Fonctions générales ============================|
//|===================================================================================|
var Get = function (url) {
	xmlHttpGet.open( "GET", url , false ); 
    xmlHttpGet.send( null );
    if(xmlHttpGet.status==200){
    	return xmlHttpGet.responseText;
    }
    else{
    	return 'error';
    }

}
var Put = function (url,paramASend){
	xmlHttpPut.open("PUT", url, false ); 
	xmlHttpPut.send(paramASend);
	if(xmlHttpPut.status==200){
		return xmlHttpPut.responseText;
	}
}
var rgbToXyBri =function (Red,Green,Blue) {
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
var xyBriToRgb = function(x,y,bri){
	if (0 > x || x > .8) {
        throw 'x property must be between 0 and .8, but is: ' + x;
    }
    if (0 > y || y > 1) {
        throw 'y property must be between 0 and 1, but is: ' + y;
    }
    if (0 > bri || bri > 1) {
        throw 'bri property must be between 0 and 1, but is: ' + bri;
    }
    var z = 1.0 - x - y;
    var X = (bri / y) * x;
    var Z = (bri / y) * z;
    var r = X * 1.612 - bri * 0.203 - Z * 0.302;
    var g = -X * 0.509 + bri * 1.412 + Z * 0.066;
    var b = X * 0.026 - bri * 0.072 + Z * 0.962;
    r = r <= 0.0031308 ? 12.92 * r : (1.0 + 0.055) * Math.pow(r, (1.0 / 2.4)) - 0.055;
    g = g <= 0.0031308 ? 12.92 * g : (1.0 + 0.055) * Math.pow(g, (1.0 / 2.4)) - 0.055;
    b = b <= 0.0031308 ? 12.92 * b : (1.0 + 0.055) * Math.pow(b, (1.0 / 2.4)) - 0.055;
    var cap = function(x) {
        return Math.max(0, Math.min(1, x));
    };
    return {
        r:  Math.round(cap(r)*255),
        g:  Math.round(cap(g)*255),
        b:  Math.round(cap(b)*255)
    };
}


//|===================================================================================|
//|================================= Fonctions spécifiques ===========================|
//|===================================================================================|
var detectionHue = function(callback){
	var hue=[];
	var rep = Get('http://'+conf.ipAdresseHue+'/api/'+conf.hueUsername+'/lights/');
	if (rep.indexOf('error')=='-1'){
		rep=JSON.parse(rep);
		for(i in rep){
			if (rep[i].state.reachable==true){
				var lampe = {lampe : i, on : rep[i].state.on, bri : rep[i].state.bri, xy: [rep[i].state.xy[0],rep[i].state.xy[1]], hue:rep[i].state.hue, sat:rep[i].state.sat};
				hue.push(lampe);
			}
		}
	}
	callback(hue);
}
var initialisationHue = function (socket,mySocket){
	detectionHue(function(hue){
		if (hue[0]!=null){
			chenillard.presenceHue(true);
			mySocket.socketInitHue(socket,hue);
		}
		else{
			chenillard.presenceHue(false);
		}

	});

}
var getAll = function (connection){

	for(var i in light){
		getknx(connection,light[i].adresse);
	}
} 
var connectionknx = function (connection,callback){

	setTimeout(function(){ 
		connection.Connect(function(){ callback();}); 
	}, 500);
	callback();
	
}
var deconnectionknx = function (connection,callback){
	connection.Disconnect(function(){callback();});
}
var setknx = function (connection,adresse,value){
	if(connection.connected){
		connection.Action(adresse,value);
	}
}
var getknx = function (connection,adresse){
	connection.RequestStatus(adresse);
}

var exec = function (connection,callback){
	if(chenillard.clockwise==true){
		for (var j=0; j<server.light.length;j++){
			k = (j+1+server.light.length) % server.light.length;
			somme+=server.light[j].etat;
			if(server.light[j].etat==1){
				newtab[k].etat=true;
			}
			else{
				newtab[k].etat=false;
			}
		}
	}
	else if(chenillard.clockwise==false){
		for (var j=0; j<server.light.length;j++){
			k = (j-1+server.light.length) % server.light.length;
			somme+=server.light[j].etat;
			if(server.light[j].etat==1){
				newtab[k].etat=true;
			}
			else{
				newtab[k].etat=false;
			}
		}
	}
	if(somme==server.light.length || somme==0){
		console.log("Pas d'action à effectuer, lampes toute allumées ou lampes toute éteintes");
	}
	else if(chenillard.on==true){
		for(var i in newtab){
			console.log(server.light[i].adresse + "   " + newtab[i].etat);
			setknx(connection,server.light[i].adresse,newtab[i].etat);
		}
	}
	else{
		console.log("Erreur");
	}
	somme = 0;
	callback();
}
var looptest = function(connection){
    if(chenillard.on==true){
		exec(connection,function(){
			setTimeout(function(){
				module.exports.looptest(connection);}, chenillard.speed
			);
		});
		}
	else{
		return;
	}
}
//|===================================================================================|
//|============================= Exports des fonctions utiles ========================|
//|===================================================================================|

exports.getIpAddress=getIpAddress;
exports.rgbToXyBri=rgbToXyBri;
exports.xyBriToRgb=xyBriToRgb;
exports.initialisationHue=initialisationHue;
exports.getAll= getAll;
exports.connectionknx=connectionknx;
exports.deconnectionknx=deconnectionknx;
exports.setknx=setknx;
exports.getknx=getknx;
exports.Put=Put;
exports.Get=Get;
exports.light=light;
exports.looptest=looptest;

