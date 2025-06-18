import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

type NotificationType = "success" | "error" | "warning" | "info";

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  timestamp: number;
  count?: number;
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
      setNotifications((prev) => {
        const existing = prev.find(
          (n) => n.message === message && n.type === type,
        );
        if (existing) {
          return prev.map((n) =>
            n.id === existing.id
              ? { ...n, count: (n.count || 1) + 1, timestamp: Date.now() }
              : n,
          );
        } else {
          const id = Math.random().toString(36).substr(2, 9);
          const newNotification = {
            id,
            message,
            type,
            timestamp: Date.now(),
            count: 1,
          };
          setTimeout(() => {
            removeNotification(id);
          }, 5000);
          return [...prev, newNotification];
        }
      });
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
