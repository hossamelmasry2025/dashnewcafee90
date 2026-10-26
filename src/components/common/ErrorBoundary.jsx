import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] w-full flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-stone-200 shadow-sm text-center my-6 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-inner">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="text-lg font-black text-chocolate-900 font-sans">
              حدث خطأ أثناء عرض هذه الصفحة
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              تم تسجيل الخطأ الداخلي لمنع توقف لوحة التحكم بالكامل. يمكنك إعادة المحاولة بالضغط على الزر أدناه.
            </p>
          </div>
          {this.state.error && (
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-stone-700 text-[11px] font-mono max-w-lg overflow-x-auto text-start">
              {this.state.error.toString()}
            </div>
          )}
          <Button
            variant="gold"
            size="sm"
            icon={RefreshCw}
            onClick={this.handleReset}
          >
            إعادة تحميل الصفحة
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
