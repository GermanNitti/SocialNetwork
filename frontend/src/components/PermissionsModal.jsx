import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function PermissionsModal() {
  const [showModal, setShowModal] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState({
    notifications: "default",
    camera: "default",
    geolocation: "default",
    contacts: "default",
  });

  useEffect(() => {
    const checkPermissions = async () => {
      const hasRequested = localStorage.getItem("permissionsRequested");

      if (!hasRequested) {
        setShowModal(true);
      } else {
        await checkCurrentStatus();
      }
    };

    checkPermissions();
  }, []);

  const checkCurrentStatus = async () => {
    try {
      const status = { ...permissionStatus };

      if ("Notification" in window) {
        status.notifications = Notification.permission;
      }

      if (navigator.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop());
          status.camera = "granted";
        } catch (e) {
          status.camera = "denied";
        }
      }

      if ("geolocation" in navigator) {
        navigator.permissions.query({ name: "geolocation" }).then(result => {
          setPermissionStatus(prev => ({ ...prev, geolocation: result.state }));
        });
      }

      if ("contacts" in navigator) {
        navigator.permissions.query({ name: "contacts" }).then(result => {
          setPermissionStatus(prev => ({ ...prev, contacts: result.state }));
        }).catch(() => {
          setPermissionStatus(prev => ({ ...prev, contacts: "unsupported" }));
        });
      }

      setPermissionStatus(status);
    } catch (error) {
      console.error("Error checking permissions:", error);
    }
  };

  const requestPermission = async (permission) => {
    try {
      switch (permission) {
        case "notifications":
          if ("Notification" in window) {
            const result = await Notification.requestPermission();
            setPermissionStatus(prev => ({ ...prev, notifications: result }));
          }
          break;

        case "camera":
          if (navigator.mediaDevices?.getUserMedia) {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ video: true });
              stream.getTracks().forEach(track => track.stop());
              setPermissionStatus(prev => ({ ...prev, camera: "granted" }));
            } catch (e) {
              setPermissionStatus(prev => ({ ...prev, camera: "denied" }));
            }
          }
          break;

        case "geolocation":
          if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
              () => setPermissionStatus(prev => ({ ...prev, geolocation: "granted" })),
              () => setPermissionStatus(prev => ({ ...prev, geolocation: "denied" }))
            );
          }
          break;

        case "contacts":
          if ("contacts" in navigator) {
            try {
              const result = await navigator.contacts.select(["name", "tel"], { multiple: true });
              setPermissionStatus(prev => ({ ...prev, contacts: "granted" }));
            } catch (e) {
              setPermissionStatus(prev => ({ ...prev, contacts: "denied" }));
            }
          }
          break;

        default:
          break;
      }
    } catch (error) {
      console.error(`Error requesting ${permission} permission:`, error);
    }
  };

  const handleAcceptAll = async () => {
    await Promise.all([
      requestPermission("notifications"),
      requestPermission("camera"),
      requestPermission("geolocation"),
      requestPermission("contacts"),
    ]);
  };

  const handleSkip = () => {
    localStorage.setItem("permissionsRequested", "true");
    setShowModal(false);
  };

  const handleContinue = () => {
    localStorage.setItem("permissionsRequested", "true");
    setShowModal(false);
  };

  const permissionIcons = {
    notifications: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    camera: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    geolocation: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    contacts: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  };

  const permissionLabels = {
    notifications: "Notificaciones",
    camera: "Cámara",
    geolocation: "Ubicación",
    contacts: "Contactos",
  };

  const permissionDescriptions = {
    notifications: "Recibe alertas y actualizaciones",
    camera: "Sube fotos y videos",
    geolocation: "Encuentra amigos cerca",
    contacts: "Invita amigos de tu agenda",
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "granted":
        return "bg-green-500";
      case "denied":
        return "bg-red-500";
      case "unsupported":
        return "bg-gray-500";
      default:
        return "bg-yellow-500";
    }
  };

  return (
    <AnimatePresence>
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
          >
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
              <h2 className="text-2xl font-bold text-white mb-2">Permisos necesarios</h2>
              <p className="text-white/90 text-sm">
                Para ofrecerte la mejor experiencia, necesitamos algunos permisos
              </p>
            </div>

            <div className="p-6 space-y-4">
              {Object.entries(permissionLabels).map(([key, label]) => (
                <motion.div
                  key={key}
                  whileHover={{ scale: 1.02 }}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    permissionStatus[key] === "granted"
                      ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20"
                      : permissionStatus[key] === "denied"
                      ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20"
                      : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700"
                  }`}
                  onClick={() => requestPermission(key)}
                >
                  <div className={`p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400`}>
                    {permissionIcons[key]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{label}</h3>
                      <span className={`w-3 h-3 rounded-full ${getStatusColor(permissionStatus[key])}`} />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {permissionDescriptions[key]}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3">
              <button
                onClick={handleSkip}
                className="flex-1 px-4 py-3 rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Saltar
              </button>
              <button
                onClick={handleContinue}
                className="flex-1 px-4 py-3 rounded-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
              >
                Continuar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
