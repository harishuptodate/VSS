
// app/layout.tsx
import "./globals.css";
import { ReactNode } from "react";
import AuthButtons from "@/components/AuthButtons";

export const metadata = { title: "Video Storage" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="bg-gray-100">
      <body className="min-h-screen">
        <div className="max-w-5xl mx-auto px-4">
          <header className="py-5 flex items-center justify-between">
            <h1 className="text-xl font-semibold tracking-tight">🎬 VStore</h1>
            <AuthButtons />
          </header>
          {children}
          <footer className="py-10 text-xs text-gray-400 text-center">© {new Date().getFullYear()} VStore</footer>
        </div>
      </body>
    </html>
  );
}



// // app/layout.tsx
// import "./globals.css";
// import { ReactNode } from "react";

// export const metadata = { title: "Video Storage" };

// export default function RootLayout({ children }: { children: ReactNode }) {
//   return (
//     <html lang="en">
//       <body className="max-w-5xl mx-auto p-4">
//         <header className="mb-6 flex items-center justify-between">
//           <h1 className="text-xl font-bold">Video Storage</h1>
//         </header>
//         {children}
//       </body>
//     </html>
//   );
// }