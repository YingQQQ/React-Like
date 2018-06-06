import {
  LOCATION_CHANGE,
  NEED_GET_DATA
} from '../constants/actionsType';

export const locationChange = () => ({
  type: LOCATION_CHANGE
});

export const needGetData = () => ({
  type: NEED_GET_DATA
});
