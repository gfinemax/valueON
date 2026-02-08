"use client";

import { useEffect } from "react";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Capacitor } from "@capacitor/core";

export function MobileStatusBar() {
    useEffect(() => {
        const setStatusBarStyle = async () => {
            if (Capacitor.isNativePlatform()) {
                try {
                    // Set background color to white to ensure contrast
                    await StatusBar.setBackgroundColor({ color: '#ffffff' });
                    // Set style to Light (which results in Dark Text on most platforms)
                    await StatusBar.setStyle({ style: Style.Light });
                } catch (e) {
                    console.warn("StatusBar plugin warning:", e);
                }
            }
        };

        setStatusBarStyle();
    }, []);

    return null;
}
