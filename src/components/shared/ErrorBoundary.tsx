import {Component, type ReactNode, type ErrorInfo} from 'react';

interface Props {children: ReactNode;}

interface State {hasError: boolean;
 error: Error | null;
 errorInfo: ErrorInfo | null;
 retryCount: number;}

/**
 * ErrorBoundary with auto-recovery for DOM reconciliation errors.
 *
 * NotFoundError / removeChild errors are typically caused by external DOM
 * interference (browser extensions, translation, autofill) and are not
 * reproducible code bugs. Auto-retry usually resolves them.
 */
export class ErrorBoundary extends Component<Props, State> {constructor(props: Props) {super(props);
 this.state = {hasError: false, error: null, errorInfo: null, retryCount: 0};}

 static getDerivedStateFromError(error: Error): Partial<State> {return {hasError: true, error};}

 componentDidCatch(error: Error, errorInfo: ErrorInfo): void {this.setState({errorInfo});
 console.error('[ErrorBoundary]', error, errorInfo);

 // Auto-retry for DOM reconciliation errors (up to 3 times)
 const isDomError =
 error.name === 'NotFoundError' ||
 error.message?.includes('removeChild') ||
 error.message?.includes('insertBefore') ||
 error.message?.includes('not a child of this node');

 if (isDomError && this.state.retryCount < 3) {console.warn(`[ErrorBoundary] DOM reconciliation error detected, auto-retrying (attempt ${this.state.retryCount + 1}/3)`);
 // Force a clean re-render by resetting state
 setTimeout(() => {this.setState({hasError: false, error: null, errorInfo: null, retryCount: this.state.retryCount + 1});}, 100);}}

 handleManualRetry = () => {this.setState({hasError: false, error: null, errorInfo: null, retryCount: 0});};

 render() {if (this.state.hasError) {const isDomError =
 this.state.error?.name === 'NotFoundError' ||
 this.state.error?.message?.includes('removeChild') ||
 this.state.error?.message?.includes('insertBefore');

 if (isDomError && this.state.retryCount < 3) {
  // Show a brief retrying message instead of the full error page
 return (<div className="flex items-center justify-center min-h-screen bg-slate-900">
 <div className="text-center p-8">
 <p className="text-sm text-slate-400">Đang tự động khôi phục...</p>
 </div>
 </div>);}

 return (<div className="flex items-center justify-center min-h-screen bg-slate-900">
 <div className="max-w-2xl text-center space-y-4 p-8">
 <p className="text-4xl">⚠</p>
 <h1 className="text-xl font-bold text-white">Đã xảy ra lỗi</h1>
 <p className="text-sm text-slate-400">Đã xảy ra lỗi khi hiển thị trang, vui lòng thử làm mới trang.</p>
 {this.state.error && (<div className="text-left">
 <p className="text-sm font-semibold text-red-300 mb-1">{this.state.error.message}</p>
 <pre className="text-[11px] text-red-400/70 bg-slate-800 p-3 rounded-lg overflow-auto max-h-48 whitespace-pre-wrap break-all">
 {this.state.error.stack}
 </pre>
 </div>)}
 <div className="flex gap-3 justify-center">
 <button
 onClick={this.handleManualRetry}
 className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-500 transition-colors"
 >Thử khôi phục lại</button>
 <button
 onClick={() => window.location.reload()}
 className="px-4 py-2 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-600 transition-colors"
 >làm mới trang</button>
 </div>
 {isDomError && (<p className="text-xs text-slate-500 mt-4">Các lỗi DOM như vậy thường do các tiện ích mở rộng của trình duyệt (bản dịch, quản lý mật khẩu, v.v.) gây ra và bạn nên kiểm tra trong môi trường không có tiện ích mở rộng.</p>)}
 </div>
 </div>);}
 return this.props.children;}}
