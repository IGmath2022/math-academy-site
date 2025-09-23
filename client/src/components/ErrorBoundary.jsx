import React from 'react';
import { logError } from '../utils/errorLogger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(_error) {
    // 다음 렌더링에서 폴백 UI를 보여주도록 상태를 업데이트 합니다.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // 에러 리포팅 서비스에 에러를 기록할 수 있습니다.
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // 상세한 에러 로깅
    logError(error, `ErrorBoundary: ${errorInfo.componentStack}`);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#ffeaa7',
          border: '1px solid #fdcb6e',
          borderRadius: '8px',
          margin: '20px'
        }}>
          <h2 style={{ color: '#e17055', marginBottom: '10px' }}>
            😓 예상치 못한 오류가 발생했습니다
          </h2>
          <p style={{ color: '#636e72', marginBottom: '20px' }}>
            페이지를 새로고침해 주시거나, 문제가 지속되면 관리자에게 문의해 주세요.
          </p>

          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#0984e3',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              marginRight: '10px'
            }}
          >
            페이지 새로고침
          </button>

          <button
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            style={{
              backgroundColor: '#00b894',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            다시 시도
          </button>

          {process.env.NODE_ENV !== "production" && this.state.error && (
            <details style={{ marginTop: '20px', textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                개발자 정보 (디버깅용)
              </summary>
              <pre style={{
                backgroundColor: '#2d3436',
                color: '#ddd',
                padding: '10px',
                borderRadius: '4px',
                fontSize: '12px',
                overflowX: 'auto'
              }}>
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;