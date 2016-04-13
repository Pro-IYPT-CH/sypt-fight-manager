var maxPhaseId = 10;
var interval;
var timer = 0;
var phases = [
	{
		"title": "Presentation by the Reporter",
		"duration": 720,
    "keepTimeFromLast": false
	},
	{
		"title": "Clarifying questions of the Opponent to the Reporter",
		"duration": 120,
    "keepTimeFromLast": false
	},
	{
		"title": "Preparation of the Opponent",
		"duration": 180,
    "keepTimeFromLast": false
	},
	{
		"title": "Presentation of the Opposition",
		"duration": 300,
    "keepTimeFromLast": false
	},
	{
		"title": "Discussion between Opponent and Reporter",
		"duration": 360,
    "keepTimeFromLast": true
	},
	{
		"title": "Summary of the discussion by the Opponent",
		"duration": 60,
    "keepTimeFromLast": false
	},
	{
		"title": "Clarifying questions of the Reviewer to Reporter and Opponent",
		"duration": 180,
    "keepTimeFromLast": false
	},
	{
		"title": "Preparation of the Reviewer",
		"duration": 120,
    "keepTimeFromLast": false
	},
	{
		"title": "Presentation of the Review",
		"duration": 240,
    "keepTimeFromLast": false
	},
	{
		"title": "Concluding remarks by the Reporter",
		"duration": 120,
    "keepTimeFromLast": false
	},
	{
		"title": "Questions of the Jury to all three teams",
		"duration": 300,
    "keepTimeFromLast": false
	}
];

var fight = {
	round: 2,
	id: 1,
	stages: [
		{
	    id: 1,
	    reporter: "John Smith",
	    opponent: "Bob Dylan",
	    reviewer: "Jane Doe",
	    phases: phases
	  },
	  {
	    id: 2,
	    opponent: "John Smith",
	    reporter: "Bob Dylan",
	    reviewer: "Jane Doe",
	    phases: phases
	  },
	  {
	    id: 3,
	    reviewer: "John Smith",
	    opponent: "Bob Dylan",
	    reporter: "Jane Doe",
	    phases: phases
	  }
	]
};

var init = function () {
	Handlebars.templates["app"] = Handlebars.compile(document.getElementById("app-template").innerHTML);
	Handlebars.templates["fight-manager"] = Handlebars.compile(document.getElementById("fight-manager-template").innerHTML);
	Handlebars.registerHelper('ifCond', function(v1, v2, options) {
	  if(v1 === v2) {
	    return options.fn(this);
	  }
	  return options.inverse(this);
	});

	Handlebars.registerHelper('displayTime', function formatTime(totsec) {
	  if(totsec > 0){
	    var min = Math.floor(totsec/60);
	    if(min < 10) min = "0" + String(min);
	    var sec = totsec%60;
	    if(sec < 10) sec = "0" + String(sec);
	    return min + ":" + sec;
	  }
	  else return "00:00";
	});

	var Fight = Thorax.Model.extend({
		initialize: function (fight) {
			this.attributes.currentRound = fight.round;
			this.attributes.currentFight = fight.id;
			this.attributes.currentStage = fight.stages[0];
			this.attributes.pastPhases = [];
			this.attributes.remainingPhases = fight.stages[0].phases;

			this.attributes.currentTime = 0;
			this.attributes.currentOvertime = 0;
			this.attributes.isPaused = true;
			this.attributes.isOvertime = false;

			this.on("previous:phase", this.resetPhase);
			this.on("next:phase", this.resetPhase);
		},
		tick: function () {
			if (this.get("isOvertime") === false) {
				this.set("currentTime", this.get("currentTime") + 1);
			} else {
				this.set("currentOvertime", this.get("currentOvertime") + 1);
			}
			console.log(this.attributes.currentTime, this.attributes.isOvertime, this.attributes.currentOvertime)
		},
		overtime: function () {
			if (this.get("remainingPhases")[1].keepTimeFromLast) {
				this.nextPhase();
			} else {
				this.set("isOvertime", true);
			}
		},
		startClock: function () {
			this.interval = setInterval(this.tick.bind(this), 1000);
			this.timeout = setTimeout(this.overtime.bind(this), this.get("remainingPhases")[0].duration*1000 - this.get("currentTime"));
			this.set("isPaused", false);
		},
		pauseClock: function () {
			clearInterval(this.interval);
			clearTimeout(this.timeout);
			this.set("isPaused", true);
		},
		switchClock: function () {},
		resetPhase: function () {
			this.set("currentTime", 0);
			this.set("isOvertime", false);
			this.set("currentOvertime", 0);
		},
		nextPhase: function () {
			if (this.get("remainingPhases").length > 1) {
				// Don't try to understand the next line! It just works!
				this.set("pastPhases", this.get("pastPhases").concat(this.get("remainingPhases").shift()));
				if (this.get("remainingPhases")[0].keepTimeFromLast) {
					var pastPhases = this.get("pastPhases");
					this.attributes.remainingPhases[0].originalDuration = this.attributes.remainingPhases[0].duration;
					this.get("remainingPhases")[0].duration += (pastPhases[pastPhases.length-1].duration - this.get("currentTime"));
				}
				this.trigger("next:phase");
			} else {
				// Tell user there are no more phases
			}
		},
		previousPhase: function () {
			if (this.get("pastPhases").length > 0) {
				// Don't try to understand the next line! It just works!
				if (this.get("remainingPhases")[0].keepTimeFromLast) {
					this.attributes.remainingPhases[0].duration = this.attributes.remainingPhases[0].originalDuration;
				}
				this.set("remainingPhases", [this.get("pastPhases").pop()].concat(this.get("remainingPhases")));
				this.trigger("previous:phase");
			} else {
				// Tell user there are no more phases
			}
		}
	});

	window.testfight = new Fight(fight);

	window.FightManager = new Thorax.View({
		initialize: function () {
			this.listenTo(this.model, "next:phase", this.render);
		},
		model: testfight,
		template: Handlebars.templates["fight-manager"],
		events: {
			"click [action=previous-phase]" : "previousPhase",
			"click [action=next-phase]" : "nextPhase",
			"click [action=reset-phase]" : "resetPhase",
			"click [action=switchclock]" : "switchClock",
		},
		previousPhase: function (e) {
			this.model.previousPhase();
		},
		nextPhase: function (e) {
			this.model.nextPhase();
		},
		switchClock: function (e) {
			if (this.model.get("isPaused") === true) {
				this.model.startClock();
			} else {
				this.model.pauseClock();
			}
		},
		resetPhase: function (e) {
			this.model.resetPhase();
		}
	});

	var App = new Thorax.LayoutView({
		template: Handlebars.templates["app"],
		items: [
			{
				active: true,
				title: "Fight Manager"
			},
			{
				active: false,
				title: "Settings"
			}
		]
	});

	App.appendTo("body");
	App.setView(FightManager);
};

document.addEventListener("DOMContentLoaded", init);


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
var oldOnLoad = function(){
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
