import { FunctionComponent, ReactNode } from "react";

export type FCC<T = {}> = FunctionComponent<T & { children?: ReactNode }>;
