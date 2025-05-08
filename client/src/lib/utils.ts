import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import Cookies from 'js-cookie';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getAccessToken = () => {
  return Cookies.get('accessToken');
};

export const isAuthenticated = () => {
  return !!Cookies.get('accessToken');
};

export const getUserRole = () => {
  return Cookies.get('userRole');
};