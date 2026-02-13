"use client";
import Home from "@/screens/Home";
import HomeToastHandler from "@/screens/HomeToastHandler";
import { Suspense } from "react";

export default function HomeClientWrapper() {
  return (
    <>
      <Suspense>
        <HomeToastHandler />
      </Suspense>
      <Home />
    </>
  );
}
