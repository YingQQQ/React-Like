import showErrorDialog from './ReactFiberErrorDialog';

/**
 * 打印出错误信息
 * @param {object} capturedError 错误信息的对象
 */
export default function logCapturedError(capturedError) {
  const logError = showErrorDialog();
  if (logError === false) {
    return;
  }
  const error = capturedError.error;
  const suppressLogging = error && error.suppressReactErrorLogging;
  if (suppressLogging) {
    return;
  }
  console.error(error);
}
