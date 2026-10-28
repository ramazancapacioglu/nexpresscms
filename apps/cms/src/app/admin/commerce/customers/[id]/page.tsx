import React from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { formatMoney } from "@nexpress/commerce";
import { getCommerceOpsRepository, getCommerceRepository, getMarketplaceRepository } from "@nexpress/database";
import { CustomerDetail } from "@/components/admin/commerce/customer-detail";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const ops = getCommerceOpsRepository(siteId);
  const customer = await ops.getCustomer(id);
  if (!customer) notFound();
  const [groups, ledger, coupons, siteOrders, marketOrders] = await Promise.all([
    ops.listGroups(),
    ops.listLoyalty(id),
    ops.listCoupons(),
    getCommerceRepository(siteId).listOrders(100),
    getMarketplaceRepository(siteId).listInboundOrders(customer.channelId ?? "", 50),
  ]);
  const ownCoupons = coupons.filter((coupon) => coupon.customerId === customer.id || (customer.groupId && coupon.groupId === customer.groupId));
  const orders = [
    ...siteOrders
      .filter((order) => order.customerId === customer.id || (customer.email && order.customerEmail === customer.email))
      .map((order) => ({
        number: order.orderNumber,
        totalLabel: formatMoney(order.totalCents, order.currency),
        source: "Site",
      })),
    ...(customer.source === "marketplace"
      ? marketOrders.map((order) => ({
          number: order.externalId,
          totalLabel: formatMoney(order.totalCents, order.currency),
          source: "Pazar yeri",
        }))
      : []),
  ];

  return (
    <CustomerDetail
      customer={customer}
      groups={groups}
      ledger={ledger}
      coupons={ownCoupons}
      orders={orders}
    />
  );
}
