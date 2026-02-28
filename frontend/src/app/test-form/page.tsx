'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';

export default function TestFormPage() {
    const containerRef = useRef<HTMLDivElement>(null);

    const initializeForm = async () => {
        if (typeof window !== 'undefined' && 'PingTree' in window) {
            const PingTree = (window as any).PingTree;

            try {
                // Initialize with specific API key and form ID
                await PingTree.init("5d68c65b1e50d8bf29b29778b4220ac8e367bc6073c5d576838cbd6307d36f37", {
                    formId: "69a132e1f9305dec70e559b9"
                });

                // Render the form
                PingTree.render("pt-lead-form", {
                    formId: "69a132e1f9305dec70e559b9",
                    title: "Frontend Test Form",
                    // primaryColor: "#cf0202",
                    onSuccess: (data: any) => console.log("Success!", data)
                });
            } catch (error: any) {
                console.error("Failed to initialize PingTree form:", error);
                if (error instanceof TypeError && error.message === 'Failed to fetch') {
                    console.warn("Possible Network/CORS error. check if backend is running and endpoint is correct.");
                }
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-bottom border-slate-100 bg-slate-50/50">
                    <h1 className="text-xl font-bold text-slate-900">PingTree Form Integration Test</h1>
                    <p className="text-sm text-slate-500 mt-1">Testing the JavaScript form library within the Next.js frontend.</p>
                </div>

                <div className="p-8">
                    <div id="pt-lead-form" ref={containerRef}>
                        {/* The form will be injected here */}
                        <div className="animate-pulse flex flex-col items-center justify-center p-12 text-slate-400">
                            <div className="h-4 w-48 bg-slate-200 rounded mb-4"></div>
                            <div className="text-sm">Loading PingTree Form...</div>
                        </div>
                    </div>
                </div>
            </div>

            <Script
                src="https://js.trustedagentforyou.com/static/pingtree.js"
                onLoad={initializeForm}
            />
        </div>
    );
}
