"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle2, AlertCircle, X, Info } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = "success") => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 pointer-events-none items-center w-full max-w-sm px-4">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`
                            pointer-events-auto
                            flex items-center gap-3 px-5 py-4 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)]
                            animate-in fade-in slide-in-from-top-4 duration-300
                            w-full border backdrop-blur-md
                            ${toast.type === "success" ? "bg-white/95 border-emerald-100 text-emerald-900" : ""}
                            ${toast.type === "error" ? "bg-white/95 border-red-100 text-red-900" : ""}
                            ${toast.type === "info" ? "bg-white/95 border-blue-100 text-blue-900" : ""}
                        `}
                    >
                        <div className={`p-1.5 rounded-lg ${
                            toast.type === "success" ? "bg-emerald-50" : 
                            toast.type === "error" ? "bg-red-50" : "bg-blue-50"
                        }`}>
                            {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                            {toast.type === "error" && <AlertCircle className="w-5 h-5 text-red-500" />}
                            {toast.type === "info" && <Info className="w-5 h-5 text-blue-500" />}
                        </div>
                        
                        <p className="text-[13px] font-bold flex-1">{toast.message}</p>
                        
                        <button 
                            onClick={() => removeToast(toast.id)} 
                            className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error("useToast must be used within a ToastProvider");
    return context;
};
