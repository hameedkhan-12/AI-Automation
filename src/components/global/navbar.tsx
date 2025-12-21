import Image from "next/image";
import Link from "next/link";
import React from "react";
import { UserButton, currentUser } from "@clerk/nextjs";

const Navbar = async () => {
  const user = await currentUser();
  return (
    <header className="fixed top-0 left-0 right-0 py-4 px-4 bg-black/40 backdrop-blur-lg z-[100] flex items-center border-b-[1px] border-neutral-900 justify-between">
      <aside className="flex items-center gap-[2px]">
        <h3 className="text-3xl font-bold">Fu</h3>
        <Image
          src={"/fuzzieLogo.png"}
          alt="Logo"
          width={15}
          height={15}
          className="shadow-sm"
        />
        <h3 className="text-3xl font-bold">zie</h3>
      </aside>
      <nav className="hidden md:flex">
        <ul className="flex items-center gap-4 list-none">
          <li>
            <Link href={"#"}>Products</Link>
          </li>
          <li>
            <Link href={"#"}>Pricing</Link>
          </li>
          <li>
            <Link href={"#"}>Clients</Link>
          </li>
          <li>
            <Link href={"#"}>Resources</Link>
          </li>
          <li>
            <Link href={"#"}>Documentation</Link>
          </li>
          <li>
            <Link href={"#"}>Enterprise</Link>
          </li>
        </ul>
      </nav>
      <aside>
        <Link
          href={"/dashboard"}
          className="relative inline-flex overflow-hidden rounded-full p-[2px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 h-10 "
        >
          <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
          <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl">
            {user ? "Dashboard" : "Get Started"}
          </span>
        </Link>
        {user ? <UserButton afterSignOutUrl="/"/> : null}
      </aside>
    </header>
  );
};

export default Navbar;
