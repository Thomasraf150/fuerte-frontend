import { mountStoreDevtool } from "simple-zustand-devtools";
import { useAuthStore } from "./authStore";

mountStoreDevtool("authStore", useAuthStore);

export { useAuthStore };
