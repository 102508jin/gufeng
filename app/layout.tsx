import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "\u53e4\u98ce\u95ee\u7b54",
  description: "\u751f\u6210\u591a\u7248\u672c\u6587\u8a00\u7b54\u590d\u3001\u767d\u8bdd\u89e3\u6790\u4e0e\u4eba\u7269\u98ce\u683c\u5316\u8f93\u51fa\u3002"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
