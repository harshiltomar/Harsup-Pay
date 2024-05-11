"use client";

import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  className?: string;
  appName: string;
}

export const Button = () => {
  return (
    <button onClick={() => alert(`Hello from your app!`)}>Good Button</button>
  );
};
