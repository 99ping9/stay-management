import Navbar from "@/components/Navbar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50 text-gray-800 font-[400] relative">
            {/* Background Gradient — Blue Theme */}
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_var(--color-blue-100)_0%,_var(--color-white)_50%,_var(--color-blue-50)_100%)] opacity-70"></div>

            <Navbar />

            <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                {children}
            </main>

            <footer className="mt-auto py-6 text-center text-sm text-gray-400 font-medium">
                <a href="https://www.biz-potential-consulting.com/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors">
                    &copy; Biz-Potential-Consulting. All rights reserved.
                </a>
            </footer>
        </div>
    );
}
