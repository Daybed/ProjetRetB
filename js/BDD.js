/*
  j'ai fait des vérifs, si t'es pas connecté toutes les fonctions retournerons 'error', 
  sur l'interface on affichera le truc pour faire ou utiliser les scénarios que si la BDD est connecté ;) BAM interface dynamique ma gueule !
  il faut lancer mongo puis mongod sur ton pc
  et apres ca roule 
  moi ils sont dans le même fichier que le projet si tu arrive pas a l'installr appel moi 
*/

var mongoose = require('mongoose');
var scenarioSchema = new mongoose.Schema({
    name: String,
    sens: Boolean,
    speed: String,
    light: String,
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
var add = function(nom, chenillard, light, hue, callback) {//nom, sens, speed, light, hue, callback
    if (connected) {
        var monScenario = new scenarioModel({
            name: nom
        });
        monScenario.sens = chenillard.sens;
        monScenario.speed = chenillard.speed;
        monScenario.light = light;
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