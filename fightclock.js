//Set to true if you want to see the different divs
var colors = false;

/******************************************************/
var currenttime;//current time during phase
var maxtime;//max time per phase
var totaltime = 45*60;//total time of the whole fight
var phaseId;//current phase ID
var starttime;//starting time of current phase
var pause;//true if clock is paused
window.onload = function(){
  currenttime = localStorage.currenttime;
  getPause(localStorage.pause);
  getData(localStorage.phaseId);
  drawClock();
  updateInfo();
  updateStage();
  if(colors) setColors();
}
window.addEventListener('storage', onStorageEvent);
function onStorageEvent(storageEvent){
  switch(storageEvent.key){
    case "extratime":
    case "phaseId": getData(storageEvent.newValue); break;
    case "pause": getPause(storageEvent.newValue); break;
    case "currenttime": currenttime = storageEvent.newValue; break;
    case "fightId":
    case "stageNr": updateStage(); break;
    case "reporterName":
    case "reporterTeam":
    case "opponentName":
    case "opponentTeam":
    case "reviewerName":
    case "reviewerTeam": updateInfo(); break;
    default: alert("Something went wrong...");
  }
  drawClock();
}
function getData(id){
  phaseId = Number(id);
  var currentPhase = phases[phaseId];
  var nextPhase = phases[phaseId + 1];
  if(nextPhase == undefined) h("nextphaseTitle","");
  else h("nextphaseTitle","Next: " + nextPhase.title);
  h("phaseTitle",currentPhase.title);
  maxtime = currentPhase.duration;
  starttime = currentPhase.startingtime;
}
function getPause(status){
  if(status == "yes"){
    pause = true;
  }
  else{
    pause = false;
  }
}
function formatTime(totsec){
  if(isNaN(totsec)) totsec = 0;
  var min = Math.floor(totsec/60);
  if(min < 10) min = "0" + String(min);
  var sec = totsec%60;
  if(sec < 10) sec = "0" + String(sec);
  return min + ":" + sec;
}
function calcPerc(){
  if(isNaN(currenttime)) return 0;
  return currenttime/maxtime;
}

function drawClock(){
  /***********************************************************************
   *                                                                     *
   * DO NOT CHANGE THE FOLLOWING CODE EXCEPT YOU KNOW WHAT YOU ARE DOING *
   *                                                                     *
   ***********************************************************************/
  var canvas = el("clock");
  var ctx = canvas.getContext("2d");
  var perc;
  if(isNaN(currenttime)) perc = 0;
  else perc = currenttime/maxtime;
  var part = Math.PI * (2 * perc + 1.5);//perc * 2 * Math.PI + 1.5 * Math.PI;

  //Declare variables
  var hw = canvas.parentElement.offsetHeight;//Height and width of canvas
  var fs = 0.1 * hw;//Font size
  var lw = 0.15 * hw;//linewidth

  //Calculate dimensions
  canvas.height = hw;
  canvas.width = hw;
  var lwot = lw/2;//line width overtime circle
  var centerx = hw/2;
  var centery = hw/2;
  var radius = 0.5*(hw - lw - 2 * lwot);
  //Clear canvas
  ctx.clearRect(0, 0, hw, hw);
  //Write current time in center
  ctx.font = "bold " + fs + "px Arial";
  ctx.textAlign = "center";
  ctx.fillText(formatTime(currenttime),centerx,centery - 20);
  //Write max time in center
  ctx.font = fs + "px Arial";
  ctx.fillText("of " + formatTime(maxtime),centerx,centery + fs);
  //Check for pause
  if(pause){
    ctx.font = 0.4*fs + "px Arial";
    ctx.fillStyle = 'red';
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", centerx, centery - fs - 30);
  }
  //Check if circle is full
  if(perc > 1){
    //Write overtime in center
    ctx.font = 0.5*fs + "px Arial";
    ctx.fillStyle = 'red';
    ctx.textAlign = "center";
    ctx.fillText("+" + formatTime(currenttime - maxtime), centerx, centery + 1.5*fs + 20);
    //Draw full red circle
    ctx.beginPath();
    ctx.arc(centerx, centery, radius, 0, 2*Math.PI, false);
    ctx.lineWidth = lw;
    ctx.strokeStyle = 'firebrick';
    ctx.stroke();
    ctx.closePath();
    //Draw overtime circle
    ctx.beginPath();
    ctx.arc(centerx, centery, radius + lw/2 + lwot/2, 1.5 * Math.PI, part - 2 * Math.PI, false);
    ctx.lineWidth = lwot;
    ctx.strokeStyle = 'red';
    ctx.stroke();
    ctx.closePath();
  }
  else{
    //Draw grey circle;
    ctx.beginPath();
    if(perc == 0) ctx.arc(centerx, centery, radius, 0, 2 * Math.PI, false);
    else ctx.arc(centerx, centery, radius, part, 1.5 * Math.PI, false);
    ctx.lineWidth = lw;
    ctx.strokeStyle = 'lightgrey';
    ctx.stroke();
    ctx.closePath();
    if(perc > 0){
      //Draw current time circle
      ctx.beginPath();
      ctx.lineWidth = lw;
      ctx.arc(centerx, centery, radius, 1.5 * Math.PI, part, false);
      if(perc >= 0.75) ctx.strokeStyle = 'firebrick';
      else ctx.strokeStyle = 'blue';
      ctx.stroke();
      ctx.closePath();
    }
  }

  drawProgressBar(perc);
}
window.onresize = drawClock;

function drawProgressBar(perc){
  var canvas = el("progressbar");
  var ctx = canvas.getContext("2d");
  var height = canvas.parentElement.offsetHeight;
  var width = 0.8 * el("bod").offsetWidth;
  var offset = width * starttime/totaltime;
  phasewidth = width * (maxtime/totaltime);
  canvas.width = width;
  canvas.height = height;
  ctx.clearRect(0, 0, width, height);
  //Draw previous phases
  for(i = 0; i < phases.length; i++){
    var ith_phase = phases[i];
    var ith_phase_start = ith_phase.startingtime;
    var ith_phase_end = ith_phase.duration;
    var ith_phase_offset_start = width * ith_phase_start/totaltime;
    var ith_phase_offset_end = width * ith_phase_end/totaltime;
    ctx.beginPath();
    ctx.rect(ith_phase_offset_start, 0, ith_phase_offset_end, height);
    ctx.strokeStyle = "lightgrey";
    ctx.stroke();
    ctx.closePath();
  }
  //Draw current phase
  ctx.beginPath();
  ctx.rect(offset, 0, phasewidth, height);
  ctx.fillStyle = "lightgrey";
  ctx.fill();
  ctx.closePath();
  //Draw grey outline
  ctx.beginPath();
  ctx.rect(0, 0, width-1, height);
  ctx.strokeStyle = "lightgrey";
  ctx.stroke();
  ctx.closePath();
}

function updateInfo(){
  h("reporterName",localStorage.reporterName);
  h("reporterTeam",localStorage.reporterTeam);
  h("opponentName",localStorage.opponentName);
  h("opponentTeam",localStorage.opponentTeam);
  h("reviewerName",localStorage.reviewerName);
  h("reviewerTeam",localStorage.reviewerTeam);
}

function updateStage(){
  h("fightId",localStorage.fightId);
  h("stageNr",localStorage.stageNr);
}

function setColors(){
  el("titleContainer").style.backgroundColor = "lightgreen";
  el("clockContainer").style.backgroundColor = "lightblue";
  el("nextContainer").style.backgroundColor = "yellow";
  el("participantsContainer").style.backgroundColor = "orange";
  el("progressbarContainer").style.backgroundColor = "white";
}
/*Get Element*/function el(id){return document.getElementById(id);}
/*Set HTML*/function h(id, txt){el(id).innerHTML=txt;}
