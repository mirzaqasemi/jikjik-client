import { useEffect, useState } from "react";

export function useDebounce<T>(query: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(query);
    useEffect(() => {
        const id = setTimeout(() => {
            setDebouncedValue(query);
        }, delay);

        return () => clearTimeout(id);
    }, [query, delay]);

    return debouncedValue;
}