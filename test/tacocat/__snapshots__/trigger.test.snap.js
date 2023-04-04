/* @web/test-runner snapshot v1 */
export const snapshots = {};

snapshots["module \"Tacocat\" listens to scope events and updates placeholder on event"] = 
`<body>
  Cards for price selection:
  <div class="taco-wcs-card">
    This card is selected by default
    <span
      class="taco-resolved taco-wcs-price"
      data-taco-wcs-analytics="ccsn_direct_individual:abm:us"
      data-taco-wcs-commitment="YEAR"
      data-taco-wcs-format="false"
      data-taco-wcs-offer="offer-3"
      data-taco-wcs-osi="osi-abm"
      data-taco-wcs-osis="osi-abm"
      data-taco-wcs-recurrence="true"
      data-taco-wcs-tax="false"
      data-taco-wcs-template="price"
      data-taco-wcs-term="MONTHLY"
      data-taco-wcs-unit="false"
    >
      54.99
    </span>
  </div>
  <div class="selected taco-wcs-card">
    This card is selected by JavaScript
    <span
      class="taco-resolved taco-wcs-price"
      data-taco-wcs-analytics="ccsn_direct_individual:m2m:us"
      data-taco-wcs-commitment="MONTH"
      data-taco-wcs-format="false"
      data-taco-wcs-offer="offer-4"
      data-taco-wcs-osi="osi-m2m"
      data-taco-wcs-osis="osi-m2m"
      data-taco-wcs-recurrence="true"
      data-taco-wcs-tax="false"
      data-taco-wcs-template="price"
      data-taco-wcs-term="MONTHLY"
      data-taco-wcs-unit="false"
    >
      82.49
    </span>
  </div>
  Selected price (should contain price from the card having "selected" class):
  <span
    class="taco-resolved taco-wcs-price taco-wcs-price-dynamic"
    data-taco-wcs-analytics="ccsn_direct_individual:m2m:us"
    data-taco-wcs-commitment="MONTH"
    data-taco-wcs-format="false"
    data-taco-wcs-offer="offer-4"
    data-taco-wcs-osis="osi-m2m"
    data-taco-wcs-recurrence="true"
    data-taco-wcs-tax="false"
    data-taco-wcs-template="price"
    data-taco-wcs-term="MONTHLY"
    data-taco-wcs-unit="false"
  >
    82.49
  </span>
</body>
`;
/* end snapshot module "Tacocat" listens to scope events and updates placeholder on event */

