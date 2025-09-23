// client/src/utils/errorLogger.js

/**
 * 개발/운영 환경에서 에러 로깅을 위한 유틸리티
 */

export const logError = (error, context = '') => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context,
    url: window.location.href,
    userAgent: navigator.userAgent,
  };

  if (process.env.NODE_ENV !== 'production') {
    // 개발환경: 콘솔에 상세 로그
    // eslint-disable-next-line no-console
    console.group('🚨 Error Details');
    // eslint-disable-next-line no-console
    console.error('Error:', error);
    // eslint-disable-next-line no-console
    console.log('Context:', context);
    // eslint-disable-next-line no-console
    console.log('URL:', window.location.href);
    // eslint-disable-next-line no-console
    console.log('Time:', errorInfo.timestamp);
    // eslint-disable-next-line no-console
    console.groupEnd();
  } else {
    // 운영환경: 간단한 로그 (실제 서비스에서는 에러 리포팅 서비스로 전송)
    // eslint-disable-next-line no-console
    console.error('[ERROR]', errorInfo.message, 'at', errorInfo.context);
  }

  return errorInfo;
};

export const logApiError = (error, endpoint) => {
  const apiErrorInfo = {
    endpoint,
    status: error.response?.status,
    statusText: error.response?.statusText,
    data: error.response?.data,
    message: error.message,
    timestamp: new Date().toISOString(),
  };

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.group('🌐 API Error Details');
    // eslint-disable-next-line no-console
    console.error('Endpoint:', endpoint);
    // eslint-disable-next-line no-console
    console.error('Status:', apiErrorInfo.status, apiErrorInfo.statusText);
    // eslint-disable-next-line no-console
    console.error('Response:', apiErrorInfo.data);
    // eslint-disable-next-line no-console
    console.error('Error:', error);
    // eslint-disable-next-line no-console
    console.groupEnd();
  }

  return apiErrorInfo;
};