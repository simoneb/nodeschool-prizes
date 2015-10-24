require('sugar');

var request = require('superagent');
var charm = require('charm')(process.stdout);
var config = require('config');

var urlFormat = 'https://www.eventbriteapi.com/v3/events/{1}/attendees/?token={2}';

function pickNext(attendees, attendeeIdx, interval) {
  var attendee = attendees[attendeeIdx],
      moreAttendees = attendeeIdx < attendees.length - 1;

  function writeAttendee(color) {
    charm.position(0, attendeeIdx + 1).background(color).write(attendee);
  }

  charm.write('\x07');
  writeAttendee('red');

  if (interval < 400) {
    setTimeout(function () {
      writeAttendee('black');

      pickNext(attendees,
          moreAttendees ? (attendeeIdx + 1) : 0,
          interval * Number.random(100, 103) / 100);
    }, interval);
  } else {
    charm.write(' << THE WINNER!');
    charm.position(0, attendees.length + 1);
  }
}

charm.reset();

request.get(urlFormat.assign(config.eventbriteEventId, config.eventbriteToken))
    .end(function (err, res) {
      var attendees = (err ? [] : res.body.attendees)
          .findAll({ status: 'Attending' })
          .map('profile')
          .sortBy('last_name')
          .map(function (a, idx) {
            return '{first_name} {last_name}'.assign(a);
          })
          .concat(process.argv.from(2))
          .map(function(a, idx) {
            return '{1}) {2}'.assign(idx+1, a);
          });

      attendees.each(function (a) {
        charm.write(a).move(-a.length, 1);
      });

      process.stdin.on('data', function () {
        pickNext(attendees, 0, 10);
      });
    });
