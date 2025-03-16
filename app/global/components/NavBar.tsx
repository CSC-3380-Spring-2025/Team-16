import Image from "next/image";
import Link from "next/link";

const NavBar = () => {
  return (
    <nav className="w-full bg-white shadow-md p-3 flex justify-between items-center font-[family-name:var(--font-geist-mono)]">
      <div className="flex items-center">
        <Image 
          src="/logo.svg" 
          alt="Logo" 
          width={50} 
          height={50} 
          className="object-contain"
          style={{transform: 'rotate(90deg)'}}
        />
        <span className="text-xl text-gray-800">ScheduleLSU</span>
      </div>

      <div className="flex space-x-6 h-full">
        <Link href="/dashboard">
          <span className="h-full flex items-center px-4 text-gray-700 hover:text-blue-500 hover:bg-gray-100 cursor-pointer">Dashboard</span>
        </Link>
        <Link href="/myschedule">
          <span className="h-full flex items-center px-4 text-gray-700 hover:text-blue-500 hover:bg-gray-100 cursor-pointer">Schedule</span>
        </Link>
        <Link href="/user">
          <span className="h-full flex items-center px-4 text-gray-700 hover:text-blue-500 hover:bg-gray-100 cursor-pointer">Profile</span>
        </Link>
      </div>
    </nav>
  );
};

export default NavBar;
