# Receipt model rationale

Scope: public evidence behind the receipt model, researched in September 2026. This reference is optional for implementation; [receipt semantics](receipt.md) owns rules and [quality cases](quality.md) owns examples. Sources establish distinctions, not exhaustive country coverage or current fiscal compliance advice.

## Monetary evidence

| Source | Distinction informing the model |
| --- | --- |
| [Japan NTA points](https://www.nta.go.jp/taxes/shiraberu/taxanswer/shohi/6480.htm), [archived receipt bonus examples](https://www.nalog.gov.ru/rn77/news/activities_fts/15175966/) | Points can reduce a price or settle an unchanged price; loyalty needs both adjustment and payment representations |
| [Square discounts](https://developer.squareup.com/docs/orders-api/discounts), [price adjustments](https://developer.squareup.com/docs/orders-api/price-adjustments) | Declared order scope differs from actual item allocation; multiple effects and calculation order matter |
| [Shopify LineItem](https://shopify.dev/docs/api/admin-graphql/2026-07/objects/LineItem), [DiscountAllocation](https://shopify.dev/docs/api/admin-graphql/2026-07/objects/DiscountAllocation) | Originals, final values and allocation coverage differ; discounted unit quotes can be approximate |
| [Square line amounts](https://developer.squareup.com/reference/square/objects/OrderLineItem), [Peppol line amounts](https://docs.peppol.eu/poacc/billing/3.0/syntax/ubl-invoice/cac-InvoiceLine/cbc-LineExtensionAmount/) | A field called total may include or exclude VAT; map meanings rather than names |
| [Peppol prices](https://docs.peppol.eu/poacc/billing/3.0/syntax/ubl-invoice/cac-InvoiceLine/cac-Price/), [allowances/charges](https://docs.peppol.eu/poacc/billing/3.0/syntax/ubl-invoice/cac-AllowanceCharge/) | Price, line and document adjustments have distinct scopes; a price may quote a base quantity other than one |
| [Square tax inclusion](https://developer.squareup.com/reference/square/enums/TaxInclusionType), [Peppol tax breakdown](https://docs.peppol.eu/poacc/billing/3.0/syntax/ubl-invoice/cac-TaxTotal/cac-TaxSubtotal/) | Included versus additional tax, taxable base and tax amount are independent facts |
| [Peppol tax categories](https://docs.peppol.eu/poacc/billing/3.0/codelist/UNCL5305/), [New York coupon examples](https://www.tax.ny.gov/pubs_and_bulls/tg_bulletins/st/coupons_and_food_stamps.htm), [Square service charges](https://developer.squareup.com/docs/orders-api/service-charges) | Exemption/category, coupon tax treatment and fee attribution cannot be reconstructed by a universal formula |
| [fiskaltrust reference tables](https://docs.fiskaltrust.cloud/docs/poscreators/middleware-doc/general/reference-tables) | Printed adjustment rows, payments, loyalty/vouchers and foreign tender have different economic roles |
| [Adyen gift cards](https://docs.adyen.com/point-of-sale/alternative-payment-methods/gift-cards-terminal-api/payment), [currency conversion](https://docs.adyen.com/point-of-sale/currency-conversion) | One bank payment may cover part of a purchase or use a different currency |
| [Archived Canadian cash-rounding example](https://budget.canada.ca/2012/themes/theme2-eng.html) | Final cash rounding need not change individual goods or taxes |
| [Refund receipt example](https://www.nalog.gov.ru/rn25/news/activities_fts/16594786/) | Refund is a source document meaning, independent of display sign conventions |

Final source amounts, optional original snapshots, scoped adjustments and separate settlement entries retain these distinctions. A single discount field or negative-product encoding loses scope; a universal reconstruction formula invents missing ordering, allocation or rounding. A complete invoice standard carries more structure than this receipt contract needs. Peppol is an invoice reference; its precision restrictions are not adopted globally.

## Advance and later settlement

[Published prepayment examples](https://www.nalog.gov.ru/rn92/news/activities_fts/16621080/) and [YooKassa receipt examples](https://yookassa.ru/developers/payment-acceptance/receipts/54fz/other-services/payments) show that the initial payment receipt can already name the goods, while a later supply receipt applies prior payment. Goods and totals may repeat across distinct documents; item presence alone does not establish delivery.

[Peppol PrepaidAmount](https://docs.peppol.eu/poacc/billing/3.0/syntax/ubl-invoice/cac-LegalMonetaryTotal/cbc-PrepaidAmount/) separates prior money from document totals; fiskaltrust's tables distinguish downpayment charge items and application payments. These motivate portable per-item stages plus receipt-level settlement, rather than every national fiscal subtype.

[Peppol billing references](https://docs.peppol.eu/poacc/billing/3.0/syntax/ubl-invoice/cac-BillingReference/) illustrate explicit document relationships when available. A payment/order reference in one API does not prove fiscal-code lookup exposes it. Published examples do not establish captured provider pairs.

## Terminology

[Square loyalty rewards](https://developer.squareup.com/docs/loyalty-api/loyalty-rewards) and [Talon.One rewards](https://docs.talon.one/docs/product/rewards/overview) use redemption for exchanging benefits. The model's redemption object preserves known points/program while the enclosing adjustment or payment supplies money.

[Kazakhstan business-register data](https://data.egov.kz/datasets/view?index=gbd_ul) and [IRAS invoice guidance](https://www.iras.gov.sg/taxes/goods-services-tax-%28gst%29/basics-of-gst/invoicing-price-display-and-record-keeping/invoicing-customers) illustrate business and tax identifiers whose schemes may differ. Hence merchant identifiers are not restricted to a tax-ID enum. `percent` follows familiar percentage-unit terminology, as in [Peppol Percent](https://docs.peppol.eu/poacc/billing/3.0/syntax/ubl-invoice/cac-TaxTotal/cac-TaxSubtotal/cac-TaxCategory/cbc-Percent/).
