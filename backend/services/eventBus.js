const EventEmitter = require('events');

class LabEventBus extends EventEmitter {}

module.exports = new LabEventBus();
