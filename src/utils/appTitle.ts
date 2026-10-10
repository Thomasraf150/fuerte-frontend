/**
 * The app name every browser tab title ends with ("Collection List · Fuerte Lending"). One plain
 * module, no 'use client', so the server root layout's title template and the client
 * useDocumentTitle hook read the same string and cannot drift apart.
 */
export const APP_NAME = 'Fuerte Lending';

/** Between the parts of a title: "{page} · {record} · Fuerte Lending". */
export const TITLE_SEPARATOR = ' · ';
