/*
chenillard ={
  on: false,
  speed: 500,
  clockwise: true,

  changestate : function(io,fonction,light){
    this.on=!this.on;
    io.emit('etat chenillard',this.on);
    if(this.on==true){
      fonction.looptest(light);
    }
  },
  changeclockwise : function(io){
    this.clockwise=!this.clockwise;
    io.emit('sens chenillard', this.clockwise);
  },

  setspeed : function(io,newspeed){
    if(newspeed<500){
      this.speed=500;
    }
    else{
      this.speed=newspeed;
    }
    io.emit('speedchenillard',this.speed);
  }
}
*/
module.exports.chenillard ={
  on: false,
  speed: 500,
  clockwise: true,

  changestate : function(io,fonction,light,connection){
    this.on=!this.on;
    io.emit('etat chenillard',this.on);
    if(this.on==true){
      fonction.looptest(connection,light);
    }
  },
  changeclockwise : function(io){
    this.clockwise=!this.clockwise;
    io.emit('sens chenillard', this.clockwise);
  },

  setspeed : function(io,newspeed){
    if(newspeed<500){
      this.speed=500;
    }
    else{
      this.speed=newspeed;
    }
    io.emit('speedchenillard',this.speed);
  }
}
