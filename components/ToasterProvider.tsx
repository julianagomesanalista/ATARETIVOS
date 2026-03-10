"use client";

import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";

export function ToasterProvider() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return <Toaster position="bottom-right" />;
}
