module.exports.chenillard ={
  on: false,
  speed: 500,
  clockwise: true,

  changestate : function(io,fonction,light,connection){
    this.on=!this.on;
    io.emit('Chenillard',{on : this.on, speed: this.speed, sens: this.clockwise});
    if(this.on==true){
      fonction.looptest(connection,light);
    }
  },
  changeclockwise : function(io){
    this.clockwise=!this.clockwise;
   io.emit('Chenillard',{on : this.on, speed: this.speed, sens: this.clockwise});
  },

  setspeed : function(io,newspeed){
    if(newspeed<500){
      this.speed=500;
    }
    else{
      this.speed=newspeed;
    }
    io.emit('Chenillard',{on : this.on, speed: this.speed, sens: this.clockwise});
  }
}
