"use client";

import { createContext, useContext } from "react";
import type { PageSchemaData } from "@nexpress/core";

/** Stüdyo tuvalindeki şema kartları için sayfanın canlı şema verisi (SEO sekmesiyle aynı kaynak). */
export const PageSchemaContext = createContext<PageSchemaData | undefined>(undefined);
export const usePageSchema = () => useContext(PageSchemaContext);
