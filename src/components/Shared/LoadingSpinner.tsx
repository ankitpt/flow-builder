interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

const LoadingSpinner = ({
  message = "Loading...",
  fullScreen = false,
}: LoadingSpinnerProps) => {
  return (
    <div
      className={`flex items-center justify-center ${fullScreen ? "absolute inset-0 bg-white bg-opacity-90 z-50" : ""}`}
    >
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600/30 border-t-transparent [border-radius:50%]"></div>
        <p className="mt-4 text-gray-600">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
