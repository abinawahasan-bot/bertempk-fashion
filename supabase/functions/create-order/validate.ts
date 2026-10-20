const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX = {
  name: 120,
  email: 254,
  phone: 40,
  line1: 200,
  city: 120,
  postal: 20,
  country: 80,
  notes: 500
};
function str(v, max) {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t || t.length > max) return null;
  return t;
}
export function validateBody(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      ok: false,
      code: "invalid_request"
    };
  }
  const body = raw;
  // Reject client-supplied money/status fields.
  const forbidden = [
    "subtotal",
    "shipping_cost",
    "total",
    "price",
    "status"
  ];
  for (const f of forbidden){
    if (Object.prototype.hasOwnProperty.call(body, f)) {
      return {
        ok: false,
        code: "client_amount_not_accepted"
      };
    }
  }
  if (Array.isArray(body.items)) {
    for (const it of body.items){
      if (it && typeof it === "object" && "price" in it) {
        return {
          ok: false,
          code: "client_amount_not_accepted"
        };
      }
    }
  }
  // items
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return {
      ok: false,
      code: "empty_cart"
    };
  }
  if (body.items.length > 50) return {
    ok: false,
    code: "too_many_items"
  };
  const items = [];
  for (const rawItem of body.items){
    if (!rawItem || typeof rawItem !== "object" || Array.isArray(rawItem)) {
      return {
        ok: false,
        code: "invalid_request"
      };
    }
    const it = rawItem;
    const productId = str(it.product_id, 64);
    if (!productId) return {
      ok: false,
      code: "invalid_request"
    };
    const size = str(it.size, 8);
    if (!size) return {
      ok: false,
      code: "invalid_request"
    };
    const colorway = it.colorway === null || it.colorway === undefined ? null : typeof it.colorway === "string" ? it.colorway.trim() || null : undefined;
    if (colorway === undefined) return {
      ok: false,
      code: "invalid_request"
    };
    if (colorway !== null && colorway.length > 64) return {
      ok: false,
      code: "invalid_request"
    };
    const q = it.quantity;
    if (typeof q !== "number" || !Number.isInteger(q)) {
      return {
        ok: false,
        code: "invalid_quantity"
      };
    }
    items.push({
      product_id: productId,
      size,
      colorway,
      quantity: q
    });
  }
  // shipping method
  const shippingMethod = str(body.shipping_method, 32);
  if (!shippingMethod || ![
    "standard",
    "express"
  ].includes(shippingMethod)) {
    return {
      ok: false,
      code: "invalid_shipping_method"
    };
  }
  // address
  if (!body.address || typeof body.address !== "object" || Array.isArray(body.address)) {
    return {
      ok: false,
      code: "invalid_address",
      fields: {
        address: "required"
      }
    };
  }
  const a = body.address;
  const fields = {};
  const fullName = str(a.full_name, MAX.name);
  if (!fullName) fields.full_name = "required";
  const email = str(a.email, MAX.email);
  if (!email || !EMAIL_RE.test(email)) fields.email = "invalid";
  const phone = str(a.phone, MAX.phone);
  if (!phone) fields.phone = "required";
  const line1 = str(a.line1, MAX.line1);
  if (!line1) fields.line1 = "required";
  const city = str(a.city, MAX.city);
  if (!city) fields.city = "required";
  const postal = str(a.postal_code, MAX.postal);
  if (!postal) fields.postal_code = "required";
  const country = str(a.country, MAX.country);
  if (!country) fields.country = "required";
  const notes = a.notes === null || a.notes === undefined ? undefined : typeof a.notes === "string" ? a.notes.trim().slice(0, MAX.notes) : undefined;
  if (Object.keys(fields).length > 0) {
    return {
      ok: false,
      code: "invalid_address",
      fields
    };
  }
  const address = {
    full_name: fullName,
    email: email.toLowerCase(),
    phone: phone,
    line1: line1,
    city: city,
    postal_code: postal,
    country: country,
    ...notes ? {
      notes
    } : {}
  };
  // payment method
  let paymentMethod = "manual_transfer";
  if (body.payment_method !== undefined && body.payment_method !== null) {
    if (typeof body.payment_method !== "string" || body.payment_method !== "manual_transfer") {
      return {
        ok: false,
        code: "invalid_request"
      };
    }
    paymentMethod = body.payment_method;
  }
  return {
    ok: true,
    value: {
      items,
      shipping_method: shippingMethod,
      address,
      payment_method: paymentMethod
    }
  };
}
