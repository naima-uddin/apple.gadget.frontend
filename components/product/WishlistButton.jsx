"use client";

import React from 'react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { useCart } from '@/components/context/CartContext';
import { useUser } from '@/components/context/UserContext';
import AuthModal from '@/components/auth/AuthModal';
import { useLanguage } from '@/components/context/LanguageContext';

export default function WishlistButton({ product }) {
  const { wishlistItems, addToWishlist, removeFromWishlist } = useCart();
  const { user } = useUser();
  const { t } = useLanguage();
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [pendingToggle, setPendingToggle] = React.useState(null);

  const id = product._id || product.id;
  const isFav = wishlistItems.includes(id);

  const toggle = () => {
    if (!user && !isFav) {
      // need login before adding
      setPendingToggle(product);
      setShowAuthModal(true);
      return;
    }

    if (isFav) removeFromWishlist(id);
    else addToWishlist(product);
  };

  React.useEffect(() => {
    if (user && pendingToggle) {
      addToWishlist(pendingToggle);
      setPendingToggle(null);
    }
  }, [user, pendingToggle, addToWishlist]);

  return (
    <>
    <button
      onClick={(e) => { e.stopPropagation(); toggle(); }}
      className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-colors
        ${isFav ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white border-gray-200 text-[#5B21B6] shadow-sm'} hover:bg-rose-500 hover:border-rose-500 hover:text-white`}
      aria-label={t("wishlist.add")}
    >
      {isFav ? <FaHeart /> : <FaRegHeart />}
    </button>
    <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>);

}
