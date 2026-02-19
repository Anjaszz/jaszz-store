import { supabase } from "../lib/supabase";
import type { Product, Order, Category, FeeSettings } from "../types";

export const SettingsService = {
  async getFeeSettings() {
    const { data, error } = await supabase
      .from("shop_settings")
      .select("value")
      .eq("key", "fee_settings")
      .single();

    if (error) throw error;
    return data.value as FeeSettings;
  },

  async updateFeeSettings(settings: FeeSettings) {
    const { error } = await supabase
      .from("shop_settings")
      .update({ value: settings })
      .eq("key", "fee_settings");

    if (error) throw error;
  },
};

export const CategoryService = {
  async getAll() {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) throw error;
    return data as Category[];
  },

  async create(categoryData: Partial<Category>) {
    const { data, error } = await supabase
      .from("categories")
      .insert([categoryData])
      .select()
      .single();

    if (error) throw error;
    return data as Category;
  },

  async update(id: string, categoryData: Partial<Category>) {
    const { data, error } = await supabase
      .from("categories")
      .update(categoryData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Category;
  },

  async delete(id: string) {
    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) throw error;
  },
};

export const ProductService = {
  async getAll() {
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(name)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    // Map categories.name to category string for backward compatibility
    return data.map((p) => ({
      ...p,
      category: p.categories?.name || p.category,
    })) as Product[];
  },

  async getByCategory(categoryId: string) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("category_id", categoryId)
      .eq("is_available", true);

    if (error) throw error;
    return data as Product[];
  },

  async create(productData: Partial<Product>) {
    const { data, error } = await supabase
      .from("products")
      .insert([productData])
      .select()
      .single();

    if (error) throw error;
    return data as Product;
  },

  async update(id: string, productData: Partial<Product>) {
    const { data, error } = await supabase
      .from("products")
      .update(productData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Product;
  },

  async delete(id: string) {
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) throw error;
  },

  async addStockItems(productId: string, items: string[]) {
    const stockEntries = items.map((content) => ({
      product_id: productId,
      content,
      is_used: false,
    }));

    const { error } = await supabase
      .from("product_stock_items")
      .insert(stockEntries);

    if (error) throw error;
  },

  async getAvailableStockItems(productId: string) {
    const { data, error } = await supabase
      .from("product_stock_items")
      .select("content")
      .eq("product_id", productId)
      .eq("is_used", false);

    if (error) throw error;
    return data.map((item) => item.content);
  },

  async replaceStockItems(productId: string, items: string[]) {
    // 1. Delete all unused stock items for this product
    const { error: deleteError } = await supabase
      .from("product_stock_items")
      .delete()
      .eq("product_id", productId)
      .eq("is_used", false);

    if (deleteError) throw deleteError;

    // 2. Insert new ones
    if (items.length > 0) {
      await this.addStockItems(productId, items);
    }
  },
};

export const OrderService = {
  async create(orderData: Partial<Order>) {
    const { data, error } = await supabase
      .from("orders")
      .insert([orderData])
      .select()
      .single();

    if (error) throw error;
    return data as Order;
  },

  async getByEmail(email: string) {
    const { data, error } = await supabase
      .from("orders")
      .select("*, product:products(*)")
      .eq("user_email", email)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as (Order & { product: Product })[];
  },

  async updateStatus(orderId: string, status: Order["status"]) {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    if (error) throw error;
  },

  async completeOrder(orderId: string, deliveryData?: string) {
    const { error } = await supabase
      .from("orders")
      .update({
        status: "completed",
        delivery_data: deliveryData,
      })
      .eq("id", orderId);

    if (error) throw error;
  },

  async getAllAdmin() {
    const { data, error } = await supabase
      .from("orders")
      .select("*, product:products(*)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as (Order & { product: Product })[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from("orders")
      .select("*, product:products(*)")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as Order & { product: Product };
  },

  supabase, // Export instance for direct access when needed
};

export const StorageService = {
  async uploadProductImage(file: File) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from("product-images").getPublicUrl(filePath);

    return publicUrl;
  },
};
