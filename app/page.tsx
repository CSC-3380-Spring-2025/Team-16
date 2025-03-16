import Image from "next/image";
import React from "react";
import Link from "next/link";
import NavBar from "./global/components/NavBar";

export default function Home() {
  return (
    <div>
      <NavBar></NavBar>
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        {/* <div className="grid "> */}
          <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
            <div className= "flex flex-col items-center sm:flex-row ml-20 mr-20">
              <Image
                // className="dark:invert"
                src="/logo.svg"
                alt="ScheduleLSU logo"
                width={100}
                height={100}
                style={{ transform: 'rotate(90deg)'}}
                priority
              />
              <div style={{ height: 100 }} className="flex justify-center items-center ext-lg lg:text-base h-10 font-[family-name:var(--font-geist-mono)]">
                <p style={{fontSize: "28px"}}>ScheduleLSU</p>
              </div>
            </div>
            <div className="section-container flex flex-col items-center align-items-center justify-center sm:flex-row ml-20 mr-20" style={{ margin: 'auto'}}>
              <ol className="list-inside list-decimal text-sm justify-center align-center text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
                <p className="text-lg mb-2 mr-10 ml-10">Pages Coming Soon:</p>
                <Link href="/login"><li className="mb-2 subsection-container">Login Page.</li></Link>
                <Link href="/upload"><li className="mb-2 subsection-container">Transcript Upload Page.</li></Link>
                <Link href="/myschedule"><li className="mb-2 subsection-container">Schedule Viewer.</li></Link>
                <Link href="/user"><li className="mb-2 subsection-container">User Page.</li></Link>
                <Link href="/load"><li className="mb-2 subsection-container">Loading.</li></Link>
                <Link href="/dashboard"><li className="mb-2 subsection-container">Dashboard.</li></Link>
              </ol>
            </div>
            

          </main>
        {/* </div> */}
      </div>
    </div>
  );
}
