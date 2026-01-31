import { useState, useEffect } from 'react';
import { toast } from "@/hooks/use-toast";
import { setGymPreferences } from "@/app/account/gympreferences/actions";

interface UseFavoritesProps {
    initialFavorites: string[];
    isAuthenticated: boolean;
}

export function useFavorites({ initialFavorites, isAuthenticated }: UseFavoritesProps) {
    const [favorites, setFavorites] = useState<string[]>(initialFavorites);

    // Initialize from LocalStorage if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            const stored = localStorage.getItem('gymFavorites');
            if (stored) {
                try {
                    setFavorites(JSON.parse(stored));
                } catch (e) {
                    console.error("Failed to parse favorites from local storage", e);
                }
            }
        }
    }, [isAuthenticated]);

    const isFavorite = (gymName: string) => favorites.includes(gymName);

    const toggleFavorite = async (gymName: string) => {
        let newFavorites: string[];
        const isAdding = !favorites.includes(gymName);

        if (isAdding) {
            newFavorites = [...favorites, gymName];
        } else {
            newFavorites = favorites.filter(f => f !== gymName);
        }

        // Optimistic update
        setFavorites(newFavorites);

        if (isAuthenticated) {
            try {
                const formData = new FormData();
                formData.append('gyms', JSON.stringify(newFavorites));
                await setGymPreferences(formData);
                toast({
                    title: isAdding ? "Added to favorites" : "Removed from favorites",
                    description: `Updated preferences for ${gymName}`,
                });
            } catch (error) {
                console.error("Failed to update preferences on server", error);
                setFavorites(favorites); // Revert on error
                toast({
                    title: "Error",
                    description: "Failed to update favorites. Please try again.",
                    variant: "destructive"
                });
            }
        } else {
            // Local Storage
            localStorage.setItem('gymFavorites', JSON.stringify(newFavorites));
            toast({
                title: isAdding ? "Added to favorites" : "Removed from favorites",
                description: "Saved to your browser",
            });
        }
    };

    return { favorites, isFavorite, toggleFavorite };
}
