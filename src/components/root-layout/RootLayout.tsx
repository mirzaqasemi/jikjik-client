import { Outlet } from 'react-router-dom';

export default function RootLayout() {
  return (
    <div className='flex flex-col relative w-full h-full items-center overflow-hidden'>
        <Outlet /> 
    </div>
  );
}
