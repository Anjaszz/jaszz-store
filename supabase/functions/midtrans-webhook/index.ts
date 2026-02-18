import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
  try {
    const notification = await req.json();
    console.log(
      "Midtrans Notification received:",
      JSON.stringify(notification),
    );

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const orderId = notification.order_id;
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;

    console.log(`Processing Order: ${orderId}, Status: ${transactionStatus}`);

    let paymentStatus = "unpaid";
    let orderStatus = "pending";

    if (transactionStatus == "capture" || transactionStatus == "settlement") {
      if (fraudStatus == "challenge") {
        paymentStatus = "challenge";
      } else {
        paymentStatus = "paid";
        orderStatus = "processing";
      }
    } else if (
      transactionStatus == "cancel" ||
      transactionStatus == "deny" ||
      transactionStatus == "expire"
    ) {
      paymentStatus = "failed";
      orderStatus = "canceled";
    }

    // If paid, check for auto-delivery
    if (paymentStatus === "paid") {
      console.log("Payment confirmed, checking for auto-delivery...");

      // 1. Get order and product details
      // Using 'product:products(*)' alias to be consistent and easier to handle
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*, product:products(*)")
        .eq("id", orderId)
        .single();

      if (orderError) {
        console.error("Error fetching order:", orderError);
      }

      // Check if product exists and has is_auto_delivery enabled
      // Note: joined data might be an array or object depending on PostgREST version/config
      const product = Array.isArray(order?.product)
        ? order.product[0]
        : order?.product;

      console.log("Product data:", JSON.stringify(product));

      if (product && product.is_auto_delivery) {
        console.log(
          "Auto-delivery is enabled for this product. Fetching stock...",
        );

        // 2. Try to get available stock
        const { data: stockItem, error: stockError } = await supabase
          .from("product_stock_items")
          .select("*")
          .eq("product_id", order.product_id)
          .eq("is_used", false)
          .limit(1)
          .maybeSingle();

        if (stockError) {
          console.error("Error fetching stock item:", stockError);
        }

        if (stockItem) {
          console.log(
            `Stock item found: ${stockItem.id}. Executing delivery...`,
          );
          // 3. Mark stock as used and update order via RPC
          const { error: rpcError } = await supabase.rpc(
            "handle_auto_delivery",
            {
              p_order_id: orderId,
              p_stock_item_id: stockItem.id,
              p_content: stockItem.content,
            },
          );

          if (rpcError) {
            console.error("RPC Error (handle_auto_delivery):", rpcError);
          } else {
            console.log("Auto-delivery successful!");
            orderStatus = "completed";
          }
        } else {
          console.log(
            "No available stock for auto-delivery. Order remains in processing.",
          );
        }
      } else {
        console.log("Auto-delivery not enabled for this product.");
      }
    }

    // Update order status (redundant if RPC succeeded, but handles payment_status and non-auto products)
    console.log(
      `Updating order ${orderId} with status: ${orderStatus}, payment: ${paymentStatus}`,
    );

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payment_status: paymentStatus,
        status: orderStatus,
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Error updating order:", updateError);
      throw updateError;
    }

    return new Response(JSON.stringify({ message: "OK" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Webhook processing error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
