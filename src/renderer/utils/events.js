'use strict';

// A lightweight event bus for communication between modules.
const bus = new EventTarget();

const TOPICS = {
  DATA_CHANGED: 'dataChanged',
};

function on(topic, handler) {
  bus.addEventListener(topic, handler);
}

function off(topic, handler) {
  bus.removeEventListener(topic, handler);
}

function emit(topic, detail) {
  bus.dispatchEvent(new CustomEvent(topic, { detail }));
}

module.exports = { on, off, emit, TOPICS };