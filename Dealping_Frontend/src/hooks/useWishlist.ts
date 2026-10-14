import { useState, useEffect } from "react"
import { View } from "../types"
import { trackingApiService } from "../services"

export function useWishlist(
  view: View,
  onItemsFound?: (found: boolean) => void
) {
  const [wishlistItems, setWishlistItems] = useState<any[]>([])
  const [wishlistLoading, setWishlistLoading] = useState(false)

  useEffect(() => {
    if (view === "wishlist") {
      setWishlistLoading(true)
      trackingApiService
        .fetchTrackingItems()
        .then((items) => {
          setWishlistItems(items)
          if (items.length > 0 && onItemsFound) {
            onItemsFound(true)
            try {
              localStorage.setItem("dealping_has_tracked", "true")
            } catch {}
          }
        })
        .finally(() => setWishlistLoading(false))
    }
  }, [view, onItemsFound])

  return {
    wishlistItems,
    wishlistLoading,
    setWishlistItems,
  }
}
