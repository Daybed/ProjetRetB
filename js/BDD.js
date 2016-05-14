/*
  j'ai fait des vérifs, si t'es pas connecté toutes les fonctions retournerons 'error', 
  sur l'interface on affichera le truc pour faire ou utiliser les scénarios que si la BDD est connecté ;) BAM interface dynamique ma gueule !
  il faut lancer mongo puis mongod sur ton pc
  et apres ca roule 
  moi ils sont dans le même fichier que le projet si tu arrive pas a l'instaler appel moi 
*/

var mongoose = require('mongoose');
var scenarioSchema = new mongoose.Schema({
    name: String,
    sens: Boolean,
    speed: String,
    ligth: String,
    hue: String
});
var scenarioModel = mongoose.model('scenario', scenarioSchema);
var connected = false;
var connection = function(name, callback) {
    mongoose.connect('mongodb://localhost/' + name, function(err) {
        if (err) {
            connected = false;
            callback(false);
        } else {
            connected = true;
            callback(true);
        }
    });
}
var add = function(nom, sens, speed, ligth, hue, callback) {
    if (connected) {
      findByName(nom,function(rep){
        if(rep!='error'){
          var monScenario = new scenarioModel({
              name: nom
          });
          monScenario.sens = sens;
          monScenario.speed = speed;
          monScenario.ligth = ligth;
          monScenario.hue = hue;
          monScenario.save(function(err,answer) {
              mongoose.connection.close();
              if (err) {
                  callback('error');
              } else {
                  callback(answer);
              }
          });
        }
        else{
          callback('error');
        }
      }) 
    }
    else{
      callback('error');
    }
}
var findById = function(id, callback) {
  if(connected){
    scenarioModel.findById(id, function(err, answer) {
        if (err) {
            callback('error');
        } else {
            callback(answer);
        }
    })
  }
  else{
    callback('error');
  }
}
var findByName = function(name, callback) {
  if(connected){
    scenarioModel.findOne({
        'name': name
    }, function(err, answer) {
        if (err) {
            callback('error');
        } else {
            callback(answer);
        }
    })
  }
  else{
    callback('error');
  }
}
var findAll=function(callback){
  if(connected){
    scenarioModel.find(function(err,answer){
      if(err){
        callback('error');
      }
      else{
        callback(answer);
      }
    })
  }
}
var removeByName = function(name, callback) {
  if(connected){
    scenarioModel.findOneAndRemove({
        'name': name
    }, function(err, answer) {
        if (err) {
            callback('error');
        } else {
            callback(answer);
        }
    })
  }
  else{
    callback('error');
  }
}
exports.findById = findById;
exports.removeByName = removeByName;
exports.findByName = findByName;
exports.connected = connected;
exports.connection = connection;
exports.add = add;