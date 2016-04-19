var increasing=0;
var decreasing=0;
var pre = 0;
var myloop;

var somme =0;
var k;
// comparesomme="";
//var time=0;
var newtab=[{etat:false},{etat:false},{etat:false},{etat:false}];


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


/*

 function loop (){

 for(i=0;i<light.length;i++){
      setknx(light[i].adresse,false);
      }

  myloop = setInterval(function() {
    if(chenillard.clockwise==true){
      decreasing=increasing;
    }
    else{
      decreasing=pre-1;
      if (decreasing==-1){
        decreasing=light.length -1;
      }
    }  

    setknx(light[pre].adresse,false);
    //light[pre].etat=0;

    setknx(light[decreasing].adresse,true);
   // light[decreasing].etat=1;

    pre = decreasing;
    increasing++;


    if(increasing>=light.length){
      increasing=0;
    }
  }, chenillard.speed);
  }
*/

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

