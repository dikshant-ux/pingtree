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
                await PingTree.init("54745478b50a804f3152c4bf9c84cd578c815ed472f6f03577f8896b99743ecf", {
                    formId: "69a53f1c6637aa56d4836325"
                });


                PingTree.render("pt-lead-form", {
                    formId: "69a53f1c6637aa56d4836325",
                    title: "Test Title",
                    // primaryColor: "#28a745",
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
        <div className="min-h-screen bg-slate-50 ">

            <div className="p-6 border-bottom border-slate-100 bg-slate-50/50">
                <h1 className="text-xl font-bold text-slate-900">PingTree Form Integration Test</h1>
                <p className="text-sm text-slate-500 mt-1">Testing the JavaScript form library within the Next.js frontend.</p>
            </div>

            <div className="p-2">
                <div id="pt-lead-form" ref={containerRef}>
                    {/* The form will be injected here */}
                    <div className="animate-pulse flex flex-col items-center justify-center p-12 text-slate-400">
                        <div className="h-4 w-48 bg-slate-200 rounded mb-4"></div>
                        <div className="text-sm">Loading PingTree Form...</div>
                    </div>
                </div>
            </div>


            <Script
                src="https://pingtree.vellko.com/static/pingtree.js"
                onLoad={initializeForm}
            />
        </div>
    );
}
