// This suite runs only against scripts/preview.cjs, never an authenticated sheet.
function settleScroll() {
  // A native hash jump can look correct for a frame before restoration overrides it.
  cy.window().then(
    (win) =>
      new Cypress.Promise<void>((resolve) => {
        let frames = 6;
        const tick = () => {
          if (--frames === 0) resolve();
          else win.requestAnimationFrame(tick);
        };
        win.requestAnimationFrame(tick);
      })
  );
}
function atSection(id: string) {
  settleScroll();
  cy.location("hash").should("eq", `#${id}`);
  cy.get(`#${id}`).should((el) => {
    expect(el[0].getBoundingClientRect().top).to.be.within(0, 25);
  });
}
describe("synthetic dashboard", () => {
  beforeEach(() => {
    cy.request("/")
      .its("headers.x-preview-data")
      .should("eq", "synthetic-samples");
    cy.visitAndCheck("/?review=1");
  });
  for (const width of [1440, 390]) {
    it(`shows exact data when selecting strength points at ${width}px`, () => {
      cy.viewport(width, 900);
      cy.get(".strength-point").first().as("firstPoint");
      cy.get("@firstPoint").scrollIntoView().trigger("mouseover");
      cy.get("@firstPoint")
        .invoke("attr", "aria-label")
        .then((label) => {
          cy.get(".strength-panel .chart-readout").should("have.text", label);
          cy.findByRole("tooltip").should("contain", label!.split(": ")[1]);
        });
      cy.get(".strength-point")
        .last()
        .click()
        .should("have.attr", "aria-pressed", "true");
      cy.findByRole("tooltip").should("be.visible");
      cy.focused().type("{esc}");
      cy.findByRole("tooltip").should("not.exist");
      cy.get("@firstPoint").focus().type("{enter}");
      cy.findByRole("tooltip").should("be.visible");
      cy.get("#exercise").select("Romanian deadlift · Dumbbells");
      cy.findByRole("tooltip").should("not.exist");
      cy.get(".strength-point").should("have.length", 1).click();
      cy.findByRole("tooltip").should("contain", "40 lb · 10 reps");
      cy.get("#exercise").select("Pull-up · Pull-up bar · Bodyweight");
      cy.findByRole("tooltip").should("not.exist");
      cy.get(".strength-point").last().click();
      cy.findByRole("tooltip").should("contain", "Bodyweight");
    });
    it(`keeps first and repeated section jumps stable at ${width}px`, () => {
      cy.viewport(width, 900);
      let reads = 0;
      cy.intercept({ query: { _data: "*" } }, (req) => {
        reads++;
        req.continue();
      });
      const targets = [
        ["Journal", "history"],
        ["Hall of Fame", "records"],
        ["Overview", "overview"],
        ["Overview", "overview"],
        ["Journal", "history"],
        ["Journal", "history"],
      ];
      targets.forEach(([name, id]) => {
        cy.scrollTo(0, 0);
        cy.get("nav").findByRole("link", { name, exact: true }).click();
        atSection(id);
        cy.focused().should("have.attr", "id", id);
        cy.location("search").should("eq", "?review=1");
      });
      cy.then(() => expect(reads).to.equal(0));
    });
  }
  it("restores back and forward positions and supports the skip and journal shortcuts", () => {
    cy.viewport(1440, 900);
    cy.get(".skip-link").focus().click();
    atSection("main");
    cy.focused().should("have.attr", "id", "main");
    cy.get(".latest-strip a").click();
    atSection("history");
    let saved = 0;
    cy.window().then((win) => {
      win.scrollBy(0, 100);
      saved = win.scrollY;
    });
    // Trigger from the current scroll offset, as keyboard activation would.
    cy.get("nav")
      .findByRole("link", { name: "Hall of Fame" })
      .then((link) => link[0].click());
    atSection("records");
    cy.go("back");
    settleScroll();
    cy.window().should((win) => expect(win.scrollY).to.equal(saved));
    cy.go("forward");
    atSection("records");
  });
  it("shows useful cardio stats and plain training weights without provenance labels", () => {
    cy.get(".program-card")
      .should("contain", "Base weights used to calculate your workout sets.")
      .and("not.contain", "Program input")
      .and("not.contain", "lb TM");
    cy.get(".calendar-day.level-1").then((tiles) =>
      cy.wrap(tiles[tiles.length - 3]).click()
    );
    cy.findByRole("dialog")
      .should("contain", "Calories")
      .and("contain", "284")
      .and("not.contain", "Recorded source")
      .and("not.contain", "Distance source");
    cy.findByRole("button", { name: "Close workout details" }).click();
    cy.findByRole("dialog").should("not.exist");
  });
});
