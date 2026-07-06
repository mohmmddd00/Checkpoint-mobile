import { createContext, useContext } from "react";

export const SearchContext = createContext("");
export function useSearchQuery() {
  return useContext(SearchContext);
}