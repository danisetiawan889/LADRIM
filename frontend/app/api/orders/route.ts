import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      address,
      items,
      courier,
      shippingCost,
      subtotal,
      discount,
      total,
      paymentMethod,
    } = body;

    const guestEmail = email || address?.email || 'guest@ladrim.com';
    const finalSubtotal = Number(subtotal || 0);
    const finalShippingCost = Number(shippingCost || 0);
    const finalDiscount = Number(discount || 0);
    const finalTotal = Number(total || finalSubtotal + finalShippingCost - finalDiscount);
    const trackingNumber = `LDRM-TRK-${Math.floor(100000 + Math.random() * 900000)}`;

    // Create the order in the database
    const order = await prisma.orders.create({
      data: {
        guest_email: guestEmail,
        status: 'processing',
        checkout_state: 'paid',
        subtotal: finalSubtotal,
        shipping_cost: finalShippingCost,
        discount: finalDiscount,
        total: finalTotal,
        courier: courier || 'Express Worldwide',
        tracking_number: trackingNumber,
        tracking_state: 'ORDERED',
        paid_at: new Date(),
        shipping_address: {
          recipient: `${address?.firstName || ''} ${address?.lastName || ''}`.trim() || 'Valued Customer',
          phone: address?.phone || '',
          line1: address?.addressLine1 || '',
          line2: address?.addressLine2 || '',
          city: address?.city || '',
          province: address?.province || '',
          postalCode: address?.postalCode || '',
          paymentMethod: paymentMethod || 'Credit Card',
          items: items || [],
        },
      },
    });

    const ref = `LDRM-${order.id.slice(0, 6).toUpperCase()}`;

    return NextResponse.json(
      {
        success: true,
        message: 'Order created successfully and queued for processing.',
        orderId: order.id,
        ref,
        trackingNumber: order.tracking_number,
        data: order,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[API_ORDERS_POST_ERROR]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    const rawOrders = await prisma.orders.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 100,
    });

    const orders = rawOrders.map((o) => {
      const addr: any = o.shipping_address || {};
      const orderItems = Array.isArray(addr.items) ? addr.items : [];
      return {
        id: o.id,
        ref: `LDRM-${o.id.slice(0, 6).toUpperCase()}`,
        user_email: o.guest_email || 'guest@ladrim.com',
        user_name: addr.recipient || 'Customer',
        items: orderItems.length > 0 ? orderItems : 1,
        item_details: orderItems,
        courier: o.courier || 'Express Shipping',
        total: Number(o.total),
        status: o.status,
        checkout_state: o.checkout_state,
        tracking_number: o.tracking_number,
        tracking_state: o.tracking_state,
        created_at: o.created_at,
        shipping_address: addr,
      };
    });

    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    console.error('[API_ORDERS_GET_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, trackingNumber, courier } = body;

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const dataToUpdate: any = {};
    if (status) dataToUpdate.status = status;
    if (trackingNumber) dataToUpdate.tracking_number = trackingNumber;
    if (courier) dataToUpdate.courier = courier;

    const updated = await prisma.orders.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      data: updated,
    });
  } catch (error: any) {
    console.error('[API_ORDERS_PATCH_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
