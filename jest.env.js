import { setImmediate, clearImmediate } from 'timers';
global.setImmediate = setImmediate;
global.clearImmediate = clearImmediate;
global.URL.createObjectURL = jest.fn();
jest.useRealTimers();
