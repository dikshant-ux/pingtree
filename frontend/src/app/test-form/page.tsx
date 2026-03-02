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
                <div id="pt-lead-form" ref={containerRef} className="max-w-[900px] mx-auto">
                    {/* Premium Loader */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 p-16 flex flex-col items-center justify-center text-center">
                        <div className="relative w-24 h-24 mb-8">
                            {/* Outer Spinning Ring */}
                            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-teal-500 rounded-full border-t-transparent animate-spin"></div>

                            {/* Inner Pulsing Circle */}
                            <div className="absolute inset-4 bg-teal-50 rounded-full flex items-center justify-center animate-pulse">
                                <svg className="w-8 h-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                        </div>

                        <h2 className="text-xl font-bold text-slate-900 mb-2">Initializing Secure Application</h2>
                        <p className="text-slate-500 text-sm max-w-sm mb-6">
                            Please wait while we establish a secure connection and prepare your personalized form.
                        </p>

                        <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                256-Bit SSL Secured
                            </span>
                        </div>
                    </div>
                </div>
            </div>


            <Script
                src="http://localhost:8000/static/pingtree.js"
                onLoad={initializeForm}
            />
        </div>
    );
}
