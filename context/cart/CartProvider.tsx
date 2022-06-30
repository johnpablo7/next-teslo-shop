import { FCC } from "../../types/fc";
import { useEffect, useReducer, useRef } from "react";
import axios, { AxiosError } from "axios";
import Cookie from "js-cookie";

import { CartContext, cartReducer } from "./";
import { ICartProduct, IOrder, ShippingAddress } from "../../interfaces";
import { tesloApi } from "../../api";

export interface CartState {
  isLoaded: boolean;
  cart: ICartProduct[];
  numberOfItems: number;
  subTotal: number;
  tax: number;
  total: number;

  shippingAddress?: ShippingAddress;
}

const CART_INITIAL_STATE: CartState = {
  isLoaded: false,
  cart: [],
  numberOfItems: 0,
  subTotal: 0,
  tax: 0,
  total: 0,
  shippingAddress: undefined,
};

export const CartProvider: FCC = ({ children }) => {
  const isCartReloading = useRef(true);
  const [state, dispatch] = useReducer(cartReducer, CART_INITIAL_STATE);

  // Efecto
  useEffect(() => {
    try {
      const cookieProducts = Cookie.get("cart")
        ? JSON.parse(Cookie.get("cart")!)
        : [];
      dispatch({
        type: "[Cart] - LoadCart from cookies | storage",
        payload: cookieProducts,
      });
    } catch (error) {
      dispatch({
        type: "[Cart] - LoadCart from cookies | storage",
        payload: [],
      });
    }
  }, []);

  useEffect(() => {
    if (Cookie.get("firstName")) {
      const shippingAddress = {
        firstName: Cookie.get("firstName") || "",
        lastName: Cookie.get("lastName") || "",
        address: Cookie.get("address") || "",
        address2: Cookie.get("address2") || "",
        zip: Cookie.get("zip") || "",
        city: Cookie.get("city") || "",
        country: Cookie.get("country") || "",
        phone: Cookie.get("phone") || "",
      };

      dispatch({
        type: "[Cart] - LoadAddress from Cookies",
        payload: shippingAddress,
      });
    }
  }, []);

  useEffect(() => {
    if (isCartReloading.current) {
      isCartReloading.current = false;
    } else {
      Cookie.set("cart", JSON.stringify(state.cart));
    }
  }, [state.cart]);

  useEffect(() => {
    const numberOfItems = state.cart.reduce(
      (prev, current) => current.quantity + prev,
      0
    );
    const subTotal = state.cart.reduce(
      (prev, current) => current.price * current.quantity + prev,
      0
    );
    const taxRate = Number(process.env.NEXT_PUBLIC_TAX_RATE || 0);

    const orderSummary = {
      numberOfItems,
      subTotal,
      tax: subTotal * taxRate,
      total: subTotal * (taxRate + 1),
    };

    dispatch({ type: "[Cart] - Update order summary", payload: orderSummary });
    // console.log({ orderSummary });
  }, [state.cart]);

  const addProductToCart = (product: ICartProduct) => {
    const productInCart = state.cart.some((p) => p._id === product._id);
    if (!productInCart)
      return dispatch({
        type: "[Cart] - Update products in cart",
        payload: [...state.cart, product],
      });

    const productInCartButDifferentSize = state.cart.some(
      (p) => p._id === product._id && p.size === product.size
    );
    if (!productInCartButDifferentSize)
      return dispatch({
        type: "[Cart] - Update products in cart",
        payload: [...state.cart, product],
      });

    // Acumular
    const updatedProducts = state.cart.map((p) => {
      if (p._id !== product._id) return p;
      if (p.size !== product.size) return p;

      // Actualizar la cantidad
      p.quantity += product.quantity;
      return p;
    });

    dispatch({
      type: "[Cart] - Update products in cart",
      payload: updatedProducts,
    });
  };

  const updateCartQuantity = (product: ICartProduct) => {
    dispatch({ type: "[Cart] - Change cart quantity", payload: product });
  };

  const removeCartProduct = (product: ICartProduct) => {
    dispatch({ type: "[Cart] - Remove product in cart", payload: product });
  };

  const updateAddress = (address: ShippingAddress) => {
    Cookie.set("firstName", address.firstName);
    Cookie.set("lastName", address.lastName);
    Cookie.set("address", address.address);
    Cookie.set("address2", address.address2 || "");
    Cookie.set("zip", address.zip);
    Cookie.set("city", address.city);
    Cookie.set("country", address.country);
    Cookie.set("phone", address.phone);

    dispatch({ type: "[Cart] - Update Address", payload: address });
  };

  const createOrder = async (): Promise<{
    hasError: boolean;
    message: string;
  }> => {
    if (!state.shippingAddress) {
      throw new Error("No hay dirección de entrega");
    }

    const body: IOrder = {
      orderItems: state.cart.map((p) => ({
        ...p,
        size: p.size!,
      })),
      shippingAddress: state.shippingAddress,
      numberOfItems: state.numberOfItems,
      subTotal: state.subTotal,
      tax: state.tax,
      total: state.total,
      isPaid: false,
    };

    try {
      const { data } = await tesloApi.post<IOrder>("/orders", body);
      // console.log({ data });

      dispatch({ type: "[Cart] - Order complete" });

      return {
        hasError: false,
        message: data._id!,
      };
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const error = err as AxiosError;
        return {
          hasError: true,
          message: error.message,
        };
      }
      return {
        hasError: true,
        message: "Error no controlado, hable con el administrador",
      };
    }
  };

  return (
    <CartContext.Provider
      value={{
        ...state,

        // Methods
        addProductToCart,
        updateCartQuantity,
        removeCartProduct,
        updateAddress,

        // Orders
        createOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
