var _ = require('lodash');
var five = require('johnny-five');
var RobotArm = require('../');

// JohnnyFive
// https://github.com/rwaldron/johnny-five/wiki/Board#parameters
var board = new five.Board({
    repl: true
});

var createRobotArm = function() {
    return new RobotArm({
        axis: {
            pivot: new five.Servo({
                pin: 3,
                center: true,
                range: [10, 170]
            }),
            stand: new five.Servo({
                pin: 5,
                center: true,
                range: [10, 170]
            }),
            shoulder: new five.Servo({
                pin: 6,
                center: true,
                range: [10, 170]
            }),
            elbow: new five.Servo({
                pin: 9,
                center: true,
                range: [10, 170]
            }),
            wrist: new five.Servo({
                pin: 10,
                center: true,
                range: [0, 180]
            }),
            claw: new five.Servo({
                pin: 11,
                center: true,
                range: [135, 175]
            })
        }
    });
};

board.on('ready', function() {
    var that = this;
    var robotarm = createRobotArm();
    var axes = _(robotarm.axis)
        .keys()
        .value();

    // Move each servo to the center point.
    var center = function() {
        var args = Array.prototype.slice.call(arguments);
        _.each(robotarm.axis, function(axis) {
            axis.center.apply(axis, args);
        });
    };

    // Move each servo to a specific position.
    var to = function() {
        var args = Array.prototype.slice.call(arguments);
        _.each(robotarm.axis, function(axis) {
            axis.to.apply(axis, args);
        });
    };

    this.repl.inject({
        robotarm: robotarm,
        axis: robotarm.axis,
        center: center,
        to: to
    });

    (function() {
        // A0=pivot, A1=stand, A2=shoulder, A3=elbow, A4=wrist
        var axes = _(robotarm.axis)
            .keys()
            .without('claw')
            .value();
        var pins = [0, 1, 2, 3, 4];

        _.each(axes, function(axis, index) {
            var pin = pins[index];

            that.analogRead(pin, _.throttle(function(value) {
                if (value < 250) {
                    robotarm.axis[axis].step(-2); // -2 degree per step
                    console.log('axis=%s, value=%d', axis, robotarm.axis[axis].value);
                }
                if (value > 750) {
                    robotarm.axis[axis].step(2); // 2 degree per step
                    console.log('axis=%s, value=%d', axis, robotarm.axis[axis].value);
                }
            }, 50)); // Only invoke func at most once per every 25ms.
        });
    })();

    (function() {
        // A5=claw
        var axis = 'claw';
        var pin = 5;

        that.analogRead(5, _.throttle(function(value) {
            var min = robotarm.axis[axis].range[0];
            var max = robotarm.axis[axis].range[1];

            value = five.Fn.scale(value, 0, 1023, min, max);

            if (robotarm.axis[axis].value != value) {
                robotarm.axis[axis].to(value);
                console.log('axis=%s, value=%d', axis, robotarm.axis[axis].value);
            }
        }, 20));
    })();
});
