// Custom type declarations for Next.js modules
// Resolves "Could not find declaration file" TypeScript errors

declare module 'next' {
  export interface Metadata {
    title?: string | { default?: string; template?: string };
    description?: string;
    keywords?: string | string[];
    authors?: Array<{ name?: string; url?: string }>;
    creator?: string;
    publisher?: string;
    robots?: string | { index?: boolean; follow?: boolean };
    openGraph?: {
      title?: string;
      description?: string;
      url?: string;
      siteName?: string;
      images?: Array<{ url: string; width?: number; height?: number; alt?: string }>;
      locale?: string;
      type?: string;
    };
    twitter?: {
      card?: string;
      title?: string;
      description?: string;
      images?: string[];
    };
    icons?: {
      icon?: string | Array<{ url: string; sizes?: string; type?: string }>;
      apple?: string | Array<{ url: string; sizes?: string }>;
    };
    manifest?: string;
    [key: string]: unknown;
  }

  export interface Viewport {
    width?: string | number;
    height?: string | number;
    initialScale?: number;
    minimumScale?: number;
    maximumScale?: number;
    userScalable?: boolean;
    themeColor?: string | Array<{ media: string; color: string }>;
    colorScheme?: 'light' | 'dark' | 'light dark';
  }

  export interface NextConfig {
    reactStrictMode?: boolean;
    experimental?: Record<string, unknown>;
    images?: {
      remotePatterns?: Array<{
        protocol?: string;
        hostname: string;
        port?: string;
        pathname?: string;
      }>;
      domains?: string[];
    };
    rewrites?(): Promise<Array<{ source: string; destination: string }>>;
    redirects?(): Promise<Array<{ source: string; destination: string; permanent: boolean }>>;
    [key: string]: unknown;
  }
}

declare module 'next/server' {
  export class NextRequest extends Request {
    nextUrl: URL;
    cookies: {
      get(name: string): { value: string } | undefined;
      getAll(): Array<{ name: string; value: string }>;
      set(options: { name: string; value: string; [key: string]: unknown }): void;
      delete(name: string): void;
    };
  }
  
  export class NextResponse extends Response {
    static json(body: unknown, init?: ResponseInit): NextResponse;
    static redirect(url: string | URL, status?: number): NextResponse;
    static rewrite(url: string | URL): NextResponse;
    static next(init?: { request?: { headers?: Headers } }): NextResponse;
    cookies: {
      get(name: string): { value: string } | undefined;
      getAll(): Array<{ name: string; value: string }>;
      set(options: { name: string; value: string; [key: string]: unknown }): void;
      delete(name: string): void;
    };
  }
}

declare module 'next/cache' {
  export function revalidatePath(path: string, type?: 'page' | 'layout'): void;
  export function revalidateTag(tag: string): void;
}

declare module 'next/headers' {
  export function cookies(): Promise<{
    get(name: string): { value: string } | undefined;
    getAll(): Array<{ name: string; value: string }>;
    set(name: string, value: string, options?: Record<string, unknown>): void;
    delete(name: string): void;
  }>;
  export function headers(): Promise<Headers>;
}

declare module 'next/navigation' {
  export function useRouter(): {
    push(url: string): void;
    replace(url: string): void;
    back(): void;
    forward(): void;
    refresh(): void;
    prefetch(url: string): void;
  };
  export function usePathname(): string;
  export function useSearchParams(): URLSearchParams;
  export function useParams<T = Record<string, string>>(): T;
  export function redirect(url: string): never;
  export function notFound(): never;
}

declare module 'next/image' {
  import type { FC, ImgHTMLAttributes } from 'react';
  interface ImageProps extends ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    fill?: boolean;
    priority?: boolean;
    quality?: number;
    placeholder?: 'blur' | 'empty';
    blurDataURL?: string;
    unoptimized?: boolean;
  }
  const Image: FC<ImageProps>;
  export default Image;
}

declare module 'next/link' {
  import type { FC, AnchorHTMLAttributes, ReactNode } from 'react';
  interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
    as?: string;
    replace?: boolean;
    scroll?: boolean;
    shallow?: boolean;
    passHref?: boolean;
    prefetch?: boolean;
    children?: ReactNode;
  }
  const Link: FC<LinkProps>;
  export default Link;
}

declare module 'next/font/google' {
  interface FontOptions {
    weight?: string | string[];
    style?: string | string[];
    subsets?: string[];
    display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
    variable?: string;
  }
  
  interface FontModule {
    className: string;
    style: { fontFamily: string };
    variable?: string;
  }
  
  export function Inter(options?: FontOptions): FontModule;
  export function Roboto(options?: FontOptions): FontModule;
  export function Open_Sans(options?: FontOptions): FontModule;
  export function Outfit(options?: FontOptions): FontModule;
  export function Geist(options?: FontOptions): FontModule;
  export function Geist_Mono(options?: FontOptions): FontModule;
}

declare module 'next/dynamic' {
  import type { ComponentType } from 'react';
  
  interface DynamicOptions<P = object> {
    loading?: ComponentType<P>;
    ssr?: boolean;
  }
  
  function dynamic<P = object>(
    dynamicImport: () => Promise<{ default: ComponentType<P> }>,
    options?: DynamicOptions<P>
  ): ComponentType<P>;
  
  export default dynamic;
}

declare module 'jspdf' {
  export class jsPDF {
    constructor(options?: { orientation?: 'p' | 'l'; unit?: string; format?: string });
    setProperties(props: { title?: string; author?: string; subject?: string }): void;
    setFontSize(size: number): void;
    text(text: string | string[], x: number, y: number): void;
    splitTextToSize(text: string, maxWidth: number): string[];
    addPage(): void;
    output(type: 'blob'): Blob;
  }
}
