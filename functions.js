function init(socket){
    //si les Hues ne sont pas connectée ou si il y a une erreur d'adresse on ne les prends pas en compte
    if (Get('http://'+conf.ipAdresseHue+'/api/'+conf.hueUsername+'/lights/')){
        initHue(function(hue){
            socket.emit('initHue',hue);
        });
    }
    //ne faut'il pas ajouter l'initialisation KNX?
}

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