import { useNotification } from "../../../contexts/NotificationContext";
import { useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import Notification from "./Notification";

const NotificationStack = () => {
  const { notifications, removeNotification } = useNotification();
  const stackRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new notifications are added
  useEffect(() => {
    if (stackRef.current) {
      stackRef.current.scrollTop = stackRef.current.scrollHeight;
    }
  }, [notifications]);

  return (
    <div
      ref={stackRef}
      className="fixed top-16 right-4 z-50 flex flex-col gap-2 max-h-[calc(100vh-4rem)] overflow-y-auto"
    >
      <AnimatePresence>
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            id={notification.id}
            message={notification.message}
            type={notification.type}
            onClose={removeNotification}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationStack;
