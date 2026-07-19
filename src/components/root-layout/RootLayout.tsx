import { Outlet } from 'react-router-dom';
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout() {
  return (
    <div className='flex flex-col relative w-full h-full items-center overflow-hidden'>
      <Outlet />
      <Toaster position="top-center"/>
    </div>
  );
}
