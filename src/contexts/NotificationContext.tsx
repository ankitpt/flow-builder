import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

type NotificationType = "success" | "error";

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  timestamp: number;
}

interface NotificationContextType {
  showNotification: (message: string, type?: NotificationType) => void;
  notifications: Notification[];
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback(
    (message: string, type: NotificationType = "success") => {
      const id = Math.random().toString(36).substr(2, 9);
      const newNotification = {
        id,
        message,
        type,
        timestamp: Date.now(),
      };

      setNotifications((prev) => [...prev, newNotification]);

      // Auto-remove notification after 5 seconds
      setTimeout(() => {
        removeNotification(id);
      }, 5000);
    },
    [],
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id),
    );
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
        notifications,
        removeNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider",
    );
  }
  return context;
}
