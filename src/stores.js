import { writable } from "svelte/store";

export const AccessToken = writable(null);
export const RefreshToken = writable(null);
export const currentLineIndex = writable(0);
export const footerMessage = writable('');