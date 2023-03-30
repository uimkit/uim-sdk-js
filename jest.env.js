import { setImmediate, clearImmediate } from 'timers'
global.setImmediate = setImmediate;
global.clearImmediate = clearImmediate;
jest.useRealTimers()