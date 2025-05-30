import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return "fas fa-check-circle text-green-600";
      case "error":
        return "fas fa-times-circle text-red-600";
      default:
        return "fas fa-info-circle text-blue-600";
    }
  };

  const getBgColor = () => {
    switch (type) {
      case "success":
        return "bg-green-100";
      case "error":
        return "bg-red-100";
      default:
        return "bg-blue-100";
    }
  };

  return (
    <div
      className={`fixed bottom-4 right-4 bg-white border border-gray-200 rounded-xl shadow-lg p-4 transform transition-transform duration-300 z-50 ${
        isVisible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="flex items-center space-x-3">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${getBgColor()}`}>
          <i className={`${getIcon()} text-sm`}></i>
        </div>
        <p className="text-sm font-medium text-gray-800">{message}</p>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="text-gray-400 hover:text-gray-600"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  );
}
