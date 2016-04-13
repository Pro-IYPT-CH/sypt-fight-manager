var maxPhaseId = 10;
var interval;
var timer = 0;
function startFight(){
  if((gV("fightInput") != "") && (gV("stageInput") != "")){
    el("startButtonDiv").style.display = "none";
    el("fightmanager").style.display = "inline-block";
    localStorage.pause = "yes";
    localStorage.phaseId = 0;
    localStorage.fightId = gV("fightInput");
    localStorage.stageNr = gV("stageInput");
    h("phaseTitle", phases[localStorage.phaseId].title);
    openClockWindow();
  }
  else alert("Please enter a fight ID and the stage number!");
}
function pause(){
  if(localStorage.pause == "no"){
    localStorage.pause = "yes";
    h("paused","PAUSED");
    el("paused").style.color = "red";
    clearInterval(interval);
  }
  else{
    localStorage.pause = "no";
    h("paused","RUNNING...");
    el("paused").style.color = "lightgreen";
    interval = setInterval(function(){
      timer = timer + 1;
    }, 1000);
  }
}
function reset(){
  timer = 0;
}
function next(){
  if(Number(localStorage.phaseId) < 10){
    localStorage.phaseId = Number(localStorage.phaseId) + 1;
    h("phaseTitle",phases[localStorage.phaseId].title);
    reset();
    h("maxtime",formatTime(phases[localStorage.phaseId].duration));
  }
}
function prev(){
  if(Number(localStorage.phaseId) > 0){
    localStorage.phaseId = Number(localStorage.phaseId) - 1;
    h("phaseTitle",phases[localStorage.phaseId].title);
    reset();
    h("maxtime",formatTime(phases[localStorage.phaseId].duration));
  }
}
function openClockWindow(){
  var timerWindow = window.open("fightclock.html", "", "status=no, fullscreen=yes");
  /*

  var timerWindow = window.open("", "", "status=yes, fullscreen=yes");
  timerWindow.document.write("Put the file fightclock.php in here when finished");

  */
}
window.onload = function(){
  var inputs = document.getElementsByTagName("input");
  for(i = 0; i < inputs.length; i++){
    inputs[i].value = "";
    inputs[i].onfocus = inputFocus;
    inputs[i].onblur = inputBlur;
  }
  window.addEventListener ('keydown', keyPress);
  setInterval(function(){
    localStorage.currenttime = timer;
    h("currenttime", formatTime(timer));
  }, 50);
  h("currenttime", formatTime(0));
  h("maxtime",formatTime(phases[0].duration));
  updateInfo();
}
function inputFocus(){
  window.removeEventListener ('keydown', keyPress);
}
function inputBlur(){
  window.addEventListener ('keydown', keyPress);
}
function keyPress(event){
  switch(event.which){
    case 39: next();break;//Left
    case 37: prev();break;//Right
    case 80: pause();break;//P
    case 82: reset();break;//R
    case 78: openClockWindow();break;//N
  }
}
function formatTime(totsec){
  if(totsec > 0){
    var min = Math.floor(totsec/60);
    if(min < 10) min = "0" + String(min);
    var sec = totsec%60;
    if(sec < 10) sec = "0" + String(sec);
    return min + ":" + sec;
  }
  else return "00:00";
}
function updateInfo(){
  localStorage.reporterName = gV("reporterName");
  localStorage.reporterTeam = gV("reporterTeam");
  localStorage.opponentName = gV("opponentName");
  localStorage.opponentTeam = gV("opponentTeam");
  localStorage.reviewerName = gV("reviewerName");
  localStorage.reviewerTeam = gV("reviewerTeam");
}
function clearInfo(){
  sV("reporterName","");
  sV("reporterTeam","");
  sV("opponentName","");
  sV("opponentTeam","");
  sV("reviewerName","");
  sV("reviewerTeam","");
  updateInfo();
}
function setTimer(){
  minInput = Number(gV("minInput"));
  secInput = Number(gV("secInput"));
  if((isNaN(secInput)) || (isNaN(minInput))){
    alert("Please enter a correct time");
  }
  else{
    timer = 60*minInput + secInput;
  }
  sV("minInput","");
  sV("secInput","");
}
function resetAll(){
  var confirm = window.confirm("Do you really want to reset the fight?");
  if(confirm){
    if(localStorage.pause == "no") pause();
    reset();
    clearInfo();
    localStorage.phaseId = 0;
    h("phaseTitle",phases[localStorage.phaseId].title);
    h("maxtime",formatTime(phases[localStorage.phaseId].duration));
  }
}
function updateStage(){
  var newStageNr = Number(gV("stageChangeInput"));
  if((isNaN(newStageNr)) || (newStageNr <= 0)) alert("Please enter a number greater than 0");
  else localStorage.stageNr = newStageNr;
}
/*Get Element*/function el(id){return document.getElementById(id);}
/*Set HTML*/function h(id, txt){el(id).innerHTML=txt;}
/*Get Value*/function gV(id){return el(id).value;}
/*Set Value*/function sV(id, txt){el(id).value=txt;}