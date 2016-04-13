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
	Handlebars.templates["clock"] = Handlebars.compile(document.getElementById("clock-template").innerHTML);

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

	var ClockView = Thorax.View.extend({
		template: Handlebars.templates["clock"]
	});

	var ProgressView = Thorax.View.extend({
		initialize: function () {
			this.render();
		},
		tagName: "canvas",
		render: function () {

		}
	});

	window.FightManager = new Thorax.View({
		initialize: function () {
			this.listenTo(this.model, "next:phase", this.render);
		},
		model: testfight,
		clock: new ClockView(),
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

function drawProgress(currentTime, duration){
	var perc = currentTime/duration;
	var canvas = document.getElementById("progressbar");
	canvas.height = canvas.parentElement.offsetHeight;
	canvas.width = canvas.parentElement.offsetWidth;
	var ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.beginPath();
	ctx.rect(0, 0, perc * canvas.width, canvas.height);
	ctx.fillStyle = "red";
	ctx.fill();
	ctx.closePath();
}
