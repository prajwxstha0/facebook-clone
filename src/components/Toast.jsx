function Toast({ toasts }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-semibold ${
            toast.type === 'success' ? 'bg-green-500' :
            toast.type === 'error'   ? 'bg-red-500'   :
            toast.type === 'loading' ? 'bg-blue-500'  : 'bg-gray-700'
          }`}
        >
          {toast.type === 'loading' ? (
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : toast.type === 'success' ? '✅' : '❌'}
          {toast.message}
        </div>
      ))}
    </div>
  );
}

export default Toast;