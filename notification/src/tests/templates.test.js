import { welcomeTemplate } from "../templates/welcome.js";

describe("welcomeTemplate", () => {
  it("returns a non-empty HTML string", () => {
    const html = welcomeTemplate({ firstName: "Dhruv", role: "user" });
    expect(typeof html).toBe("string");
    expect(html.length).toBeGreaterThan(0);
    expect(html).toContain("<!DOCTYPE html>");
  });

  it("includes the recipient's first name", () => {
    const html = welcomeTemplate({ firstName: "Dhruv", role: "user" });
    expect(html).toContain("Dhruv");
  });

  it("capitalizes and includes the role", () => {
    const html = welcomeTemplate({ firstName: "Dhruv", role: "artist" });
    expect(html).toContain("Artist");
  });

  it("works with different roles", () => {
    const user = welcomeTemplate({ firstName: "A", role: "user" });
    const artist = welcomeTemplate({ firstName: "A", role: "artist" });
    expect(user).toContain("User");
    expect(artist).toContain("Artist");
  });

  it("includes Lumina branding and burnt orange accent color", () => {
    const html = welcomeTemplate({ firstName: "Dhruv", role: "user" });
    expect(html).toContain("Lumina");
    expect(html).toContain("#c84b31");
  });

  it("includes the current year in the footer", () => {
    const html = welcomeTemplate({ firstName: "Dhruv", role: "user" });
    expect(html).toContain(String(new Date().getFullYear()));
  });
});
