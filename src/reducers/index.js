import {
  combineReducers
} from 'redux';
import {
  routerReducer
} from 'react-router-redux';
import locationChange from './locationChange';

export default combineReducers({
  routerReducer,
  locationChange
});
